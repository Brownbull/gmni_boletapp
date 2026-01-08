#!/usr/bin/env npx tsx
/**
 * Compare token counts between prompt versions
 *
 * Usage: npx tsx prompt-testing/scripts/compare-prompts.ts
 */

import { buildPrompt, getPrompt, listPrompts, ACTIVE_PROMPT } from '../prompts';

// Estimate tokens (rough: ~4 chars per token for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Gemini pricing (as of Dec 2024)
const GEMINI_PRICING = {
  'gemini-2.0-flash': {
    inputPer1M: 0.075,  // $0.075 per 1M input tokens
    outputPer1M: 0.30,  // $0.30 per 1M output tokens
  },
  'gemini-1.5-flash': {
    inputPer1M: 0.075,
    outputPer1M: 0.30,
  },
};

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           Prompt Version Token Comparison                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// List available prompts
console.log('Available Prompts:');
for (const p of listPrompts()) {
  const isActive = p.id === ACTIVE_PROMPT.id ? ' ← ACTIVE' : '';
  console.log(`  • ${p.id}: ${p.name} (v${p.version})${isActive}`);
}

// Test with different inputs
const testInputs = [
  { currency: 'CLP', receiptType: 'auto' as const, label: 'Default (CLP, auto)' },
  { currency: 'CLP', receiptType: 'parking' as const, label: 'Parking (CLP)' },
  { currency: 'USD', receiptType: 'restaurant' as const, label: 'Restaurant (USD)' },
  { currency: 'MXN', receiptType: 'supermarket' as const, label: 'Supermarket (MXN)' },
];

console.log('\n' + '─'.repeat(65));
console.log('Token Comparison by Input Scenario\n');

const v1Config = getPrompt('v1-original');
const v2Config = getPrompt('v2-multi-currency-types');
const v3Config = getPrompt('v3-category-standardization');

if (!v1Config || !v2Config || !v3Config) {
  console.error('Error: Could not find prompt configs');
  process.exit(1);
}

// V2 vs V3 comparison (current focus)
console.log('┌─────────────────────────┬───────────┬───────────┬──────────────┐');
console.log('│ Scenario                │ V2 Tokens │ V3 Tokens │ Savings      │');
console.log('├─────────────────────────┼───────────┼───────────┼──────────────┤');

let totalV2 = 0;
let totalV3 = 0;

for (const input of testInputs) {
  const v2Prompt = buildPrompt({ ...input, promptConfig: v2Config });
  const v3Prompt = buildPrompt({ ...input, promptConfig: v3Config });

  const v2Tokens = estimateTokens(v2Prompt);
  const v3Tokens = estimateTokens(v3Prompt);
  const savings = v2Tokens - v3Tokens;
  const pct = ((savings / v2Tokens) * 100).toFixed(0);

  totalV2 += v2Tokens;
  totalV3 += v3Tokens;

  const scenario = input.label.padEnd(23);
  const v2Str = v2Tokens.toString().padStart(9);
  const v3Str = v3Tokens.toString().padStart(9);
  const savStr = `-${savings} (${pct}%)`.padStart(12);

  console.log(`│ ${scenario} │${v2Str} │${v3Str} │${savStr} │`);
}

console.log('└─────────────────────────┴───────────┴───────────┴──────────────┘');

// Average
const avgV2 = Math.round(totalV2 / testInputs.length);
const avgV3 = Math.round(totalV3 / testInputs.length);
const avgSavings = avgV2 - avgV3;
const avgPct = ((avgSavings / avgV2) * 100).toFixed(0);

console.log(`\nV2→V3: ${avgV2} → ${avgV3} tokens (SAVED ${avgSavings} tokens, ${avgPct}% reduction)`);

// Cost estimation
console.log('\n' + '─'.repeat(65));
console.log('Cost Savings V2 → V3 (Gemini 2.0 Flash)\n');

const pricing = GEMINI_PRICING['gemini-2.0-flash'];
const scansPerMonth = [1000, 10000, 100000, 1000000];

console.log('┌────────────────┬────────────────┬────────────────┬─────────────────┐');
console.log('│ Scans/Month    │ V2 Cost        │ V3 Cost        │ Monthly Savings │');
console.log('├────────────────┼────────────────┼────────────────┼─────────────────┤');

for (const scans of scansPerMonth) {
  const v2Cost = (avgV2 * scans / 1_000_000) * pricing.inputPer1M;
  const v3Cost = (avgV3 * scans / 1_000_000) * pricing.inputPer1M;
  const savings = v2Cost - v3Cost;

  const scansStr = scans.toLocaleString().padEnd(14);
  const v2Str = `$${v2Cost.toFixed(4)}`.padStart(14);
  const v3Str = `$${v3Cost.toFixed(4)}`.padStart(14);
  const savStr = `-$${savings.toFixed(4)}`.padStart(15);

  console.log(`│ ${scansStr} │${v2Str} │${v3Str} │${savStr} │`);
}

console.log('└────────────────┴────────────────┴────────────────┴─────────────────┘');

console.log('\nNote: Costs are INPUT tokens only. Output tokens (response) are the same.');
console.log('      V3 also removes currency from input (AI auto-detects), further simplifying UX.');

// Show actual prompt lengths
console.log('\n' + '─'.repeat(65));
console.log('Raw Prompt Sizes (characters)\n');

// V3 doesn't need currency input, use empty string to simulate
const v2Input = { currency: 'CLP', receiptType: 'auto' as const };
const v3Input = { currency: '', receiptType: 'auto' as const };  // V3 auto-detects
const v2Final = buildPrompt({ ...v2Input, promptConfig: v2Config });
const v3Final = buildPrompt({ ...v3Input, promptConfig: v3Config });

console.log(`V2 (${v2Config.name}):`);
console.log(`  ${v2Final.length} characters (~${estimateTokens(v2Final)} tokens)\n`);

console.log(`V3 (${v3Config.name}):`);
console.log(`  ${v3Final.length} characters (~${estimateTokens(v3Final)} tokens)\n`);

const charSavings = v2Final.length - v3Final.length;
const charPct = ((charSavings / v2Final.length) * 100).toFixed(0);
console.log(`Character reduction: ${charSavings} chars (${charPct}%)`);
