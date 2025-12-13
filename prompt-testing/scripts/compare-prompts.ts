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

if (!v1Config || !v2Config) {
  console.error('Error: Could not find prompt configs');
  process.exit(1);
}

// Table header
console.log('┌─────────────────────────┬───────────┬───────────┬───────────┐');
console.log('│ Scenario                │ V1 Tokens │ V2 Tokens │ Increase  │');
console.log('├─────────────────────────┼───────────┼───────────┼───────────┤');

let totalV1 = 0;
let totalV2 = 0;

for (const input of testInputs) {
  const v1Prompt = buildPrompt({ ...input, promptConfig: v1Config });
  const v2Prompt = buildPrompt({ ...input, promptConfig: v2Config });

  const v1Tokens = estimateTokens(v1Prompt);
  const v2Tokens = estimateTokens(v2Prompt);
  const increase = v2Tokens - v1Tokens;
  const pct = ((increase / v1Tokens) * 100).toFixed(0);

  totalV1 += v1Tokens;
  totalV2 += v2Tokens;

  const scenario = input.label.padEnd(23);
  const v1Str = v1Tokens.toString().padStart(9);
  const v2Str = v2Tokens.toString().padStart(9);
  const incStr = `+${increase} (${pct}%)`.padStart(9);

  console.log(`│ ${scenario} │${v1Str} │${v2Str} │${incStr} │`);
}

console.log('└─────────────────────────┴───────────┴───────────┴───────────┘');

// Average
const avgV1 = Math.round(totalV1 / testInputs.length);
const avgV2 = Math.round(totalV2 / testInputs.length);
const avgIncrease = avgV2 - avgV1;
const avgPct = ((avgIncrease / avgV1) * 100).toFixed(0);

console.log(`\nAverage: V1=${avgV1} tokens, V2=${avgV2} tokens (+${avgIncrease}, +${avgPct}%)`);

// Cost estimation
console.log('\n' + '─'.repeat(65));
console.log('Cost Impact Estimation (Gemini 2.0 Flash)\n');

const pricing = GEMINI_PRICING['gemini-2.0-flash'];
const scansPerMonth = [1000, 10000, 100000];

console.log('┌────────────────┬────────────────┬────────────────┬─────────────┐');
console.log('│ Scans/Month    │ V1 Cost        │ V2 Cost        │ Difference  │');
console.log('├────────────────┼────────────────┼────────────────┼─────────────┤');

for (const scans of scansPerMonth) {
  // Cost = (tokens * scans / 1M) * pricePerM
  // Using average token counts, input only (output is same for both)
  const v1Cost = (avgV1 * scans / 1_000_000) * pricing.inputPer1M;
  const v2Cost = (avgV2 * scans / 1_000_000) * pricing.inputPer1M;
  const diff = v2Cost - v1Cost;

  const scansStr = scans.toLocaleString().padEnd(14);
  const v1Str = `$${v1Cost.toFixed(4)}`.padStart(14);
  const v2Str = `$${v2Cost.toFixed(4)}`.padStart(14);
  const diffStr = `+$${diff.toFixed(4)}`.padStart(11);

  console.log(`│ ${scansStr} │${v1Str} │${v2Str} │${diffStr} │`);
}

console.log('└────────────────┴────────────────┴────────────────┴─────────────┘');

console.log('\nNote: Costs are INPUT tokens only. Output tokens (response) are the same.');
console.log('      Actual token counts may vary ~10-20% from character-based estimates.');

// Show actual prompt lengths
console.log('\n' + '─'.repeat(65));
console.log('Raw Prompt Sizes (characters)\n');

const defaultInput = { currency: 'CLP', receiptType: 'parking' as const };
const v1Final = buildPrompt({ ...defaultInput, promptConfig: v1Config });
const v2Final = buildPrompt({ ...defaultInput, promptConfig: v2Config });

console.log(`V1 (${v1Config.name}):`);
console.log(`  ${v1Final.length} characters\n`);

console.log(`V2 (${v2Config.name}):`);
console.log(`  ${v2Final.length} characters\n`);

// Show truncated preview
console.log('V1 Preview (first 200 chars):');
console.log(`  "${v1Final.substring(0, 200)}..."\n`);

console.log('V2 Preview (first 300 chars):');
console.log(`  "${v2Final.substring(0, 300)}..."`);
