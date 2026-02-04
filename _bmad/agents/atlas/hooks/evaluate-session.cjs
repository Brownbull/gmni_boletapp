#!/usr/bin/env node
/**
 * Atlas Session Evaluator
 * Analyzes observations to detect patterns and update instincts.
 *
 * Can be triggered by:
 * - session-end.js hook
 * - /atlas-sync-observations workflow
 * - Manual execution
 *
 * Pattern detection includes:
 * - Repeated workflows (tool sequences)
 * - Error resolutions
 * - Preference signals
 */

const fs = require('fs');
const path = require('path');

// Resolve Atlas paths relative to project
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const ATLAS_ROOT = path.join(PROJECT_DIR, '_bmad/agents/atlas');
const SIDECAR_DIR = path.join(ATLAS_ROOT, 'atlas-sidecar');
const LEARNING_DIR = path.join(SIDECAR_DIR, 'learning');
const CONFIG_PATH = path.join(LEARNING_DIR, 'config.json');
const OBSERVATIONS_PATH = path.join(LEARNING_DIR, 'observations.jsonl');
const INSTINCTS_PATH = path.join(LEARNING_DIR, 'instincts.json');

/**
 * Load configuration with defaults
 */
function loadConfig() {
  const defaults = {
    learning: { enabled: false },
    instincts: {
      minConfidence: 0.3,
      maxConfidence: 0.9,
      initialConfidence: 0.4,
      reinforcementBoost: 0.1,
      confidenceDecayRate: 0.05,
      decayIntervalDays: 7,
      maxInstincts: 100,
      patterns: {
        userCorrections: true,
        errorResolutions: true,
        repeatedWorkflows: true,
        preferenceSignals: true
      }
    },
    observations: {
      keepRecentCount: 100
    }
  };

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return { ...defaults, ...config };
    }
  } catch {
    // Use defaults
  }
  return defaults;
}

/**
 * Log message to stderr
 */
function log(message) {
  console.error(`[Atlas Evaluate] ${message}`);
}

/**
 * Load observations from JSONL file
 */
function loadObservations() {
  try {
    if (fs.existsSync(OBSERVATIONS_PATH)) {
      const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Load existing instincts
 */
function loadInstincts() {
  try {
    if (fs.existsSync(INSTINCTS_PATH)) {
      return JSON.parse(fs.readFileSync(INSTINCTS_PATH, 'utf8'));
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Save instincts to file
 */
function saveInstincts(instincts) {
  fs.writeFileSync(INSTINCTS_PATH, JSON.stringify(instincts, null, 2));
}

/**
 * Generate a simple hash for pattern IDs
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
}

/**
 * Detect repeated workflow patterns (tool sequences)
 */
function detectRepeatedWorkflows(observations) {
  const patterns = [];
  const toolSequences = {};

  // Group observations by session
  const bySession = {};
  observations.forEach(obs => {
    const sid = obs.sessionId || 'default';
    if (!bySession[sid]) bySession[sid] = [];
    bySession[sid].push(obs.toolName);
  });

  // Find repeated sequences (length 2-4)
  for (const tools of Object.values(bySession)) {
    for (let len = 2; len <= 4; len++) {
      for (let i = 0; i <= tools.length - len; i++) {
        const seq = tools.slice(i, i + len).join(' -> ');
        toolSequences[seq] = (toolSequences[seq] || 0) + 1;
      }
    }
  }

  // Report sequences appearing 3+ times
  for (const [seq, count] of Object.entries(toolSequences)) {
    if (count >= 3) {
      patterns.push({
        id: `workflow-${hashString(seq)}`,
        description: `Common workflow: ${seq}`,
        context: 'repeated_workflow',
        occurrences: count
      });
    }
  }

  return patterns;
}

/**
 * Detect error resolution patterns
 */
function detectErrorResolutions(observations) {
  const patterns = [];

  for (let i = 1; i < observations.length; i++) {
    const prev = observations[i - 1];
    const curr = observations[i];

    // Check for error -> success with same tool
    if (prev.resultSummary?.success === false &&
        curr.resultSummary?.success === true &&
        prev.toolName === curr.toolName) {

      const inputPreview = typeof curr.input === 'object'
        ? JSON.stringify(curr.input).slice(0, 100)
        : String(curr.input).slice(0, 100);

      patterns.push({
        id: `error-fix-${prev.toolName}-${hashString(inputPreview)}`,
        description: `${prev.toolName} error resolved by retry with modified approach`,
        context: 'error_resolution',
        occurrences: 1
      });
    }
  }

  return patterns;
}

/**
 * Detect preference signals (frequently used tools/paths)
 */
function detectPreferenceSignals(observations) {
  const patterns = [];
  const preferences = {
    tools: {},
    extensions: {},
    directories: {}
  };

  observations.forEach(obs => {
    // Count tools
    preferences.tools[obs.toolName] = (preferences.tools[obs.toolName] || 0) + 1;

    // Extract file info
    const filePath = obs.input?.file_path || obs.input?.path || '';
    if (filePath) {
      const ext = path.extname(filePath);
      if (ext) {
        preferences.extensions[ext] = (preferences.extensions[ext] || 0) + 1;
      }

      const dir = path.dirname(filePath).split('/').slice(-2).join('/');
      if (dir && dir !== '.') {
        preferences.directories[dir] = (preferences.directories[dir] || 0) + 1;
      }
    }
  });

  // Report significant tool preferences
  const topTool = Object.entries(preferences.tools)
    .sort((a, b) => b[1] - a[1])[0];

  if (topTool && topTool[1] >= 10) {
    patterns.push({
      id: `pref-tool-${topTool[0].toLowerCase()}`,
      description: `Frequently uses ${topTool[0]} tool`,
      context: 'tool_preference',
      occurrences: topTool[1]
    });
  }

  // Report significant directory preferences
  const topDir = Object.entries(preferences.directories)
    .sort((a, b) => b[1] - a[1])[0];

  if (topDir && topDir[1] >= 5) {
    patterns.push({
      id: `pref-dir-${hashString(topDir[0])}`,
      description: `Frequently works in ${topDir[0]}`,
      context: 'directory_preference',
      occurrences: topDir[1]
    });
  }

  return patterns;
}

/**
 * Detect all patterns based on config
 */
function detectPatterns(observations, config) {
  const patterns = [];
  const patternConfig = config.instincts.patterns;

  if (patternConfig.repeatedWorkflows) {
    patterns.push(...detectRepeatedWorkflows(observations));
  }

  if (patternConfig.errorResolutions) {
    patterns.push(...detectErrorResolutions(observations));
  }

  if (patternConfig.preferenceSignals) {
    patterns.push(...detectPreferenceSignals(observations));
  }

  return patterns;
}

/**
 * Main evaluation logic
 */
async function main() {
  const config = loadConfig();

  if (!config.learning.enabled) {
    log('Learning disabled');
    process.exit(0);
  }

  // Load current instincts
  let instincts = loadInstincts();

  // Load and validate observations
  const observations = loadObservations();
  if (observations.length === 0) {
    log('No observations to process');
    process.exit(0);
  }

  log(`Processing ${observations.length} observations`);

  // Detect patterns
  const patterns = detectPatterns(observations, config);
  log(`Detected ${patterns.length} patterns`);

  // Update instincts with detected patterns
  const instinctConfig = config.instincts;
  const now = new Date().toISOString();

  for (const pattern of patterns) {
    const existing = instincts.find(i => i.id === pattern.id);

    if (existing) {
      // Reinforce existing instinct
      existing.confidence = Math.min(
        instinctConfig.maxConfidence,
        existing.confidence + instinctConfig.reinforcementBoost
      );
      existing.lastConfirmed = now;
      existing.occurrences = (existing.occurrences || 0) + pattern.occurrences;
    } else {
      // Add new instinct
      instincts.push({
        id: pattern.id,
        pattern: pattern.description,
        confidence: instinctConfig.initialConfidence,
        context: pattern.context,
        firstSeen: now,
        lastConfirmed: now,
        occurrences: pattern.occurrences
      });
    }
  }

  // Apply confidence decay to stale instincts
  const decayDays = instinctConfig.decayIntervalDays || 7;
  const decayRate = instinctConfig.confidenceDecayRate || 0.05;
  const nowDate = new Date();

  instincts = instincts.map(instinct => {
    const lastConfirmed = new Date(instinct.lastConfirmed);
    const daysSince = (nowDate - lastConfirmed) / (1000 * 60 * 60 * 24);

    if (daysSince > decayDays) {
      const decayPeriods = Math.floor(daysSince / decayDays);
      instinct.confidence = Math.max(
        0,
        instinct.confidence - (decayRate * decayPeriods)
      );
    }

    return instinct;
  });

  // Remove instincts below minimum confidence
  const minConfidence = instinctConfig.minConfidence || 0.3;
  const beforeCount = instincts.length;
  instincts = instincts.filter(i => i.confidence >= minConfidence);
  const removedCount = beforeCount - instincts.length;

  // Limit total instincts
  const maxInstincts = instinctConfig.maxInstincts || 100;
  if (instincts.length > maxInstincts) {
    // Keep highest confidence instincts
    instincts.sort((a, b) => b.confidence - a.confidence);
    instincts = instincts.slice(0, maxInstincts);
  }

  // Save updated instincts
  saveInstincts(instincts);

  // Archive processed observations (keep recent ones)
  const keepCount = config.observations.keepRecentCount || 100;
  const recentObservations = observations.slice(-keepCount);
  fs.writeFileSync(
    OBSERVATIONS_PATH,
    recentObservations.map(o => JSON.stringify(o)).join('\n') + '\n'
  );

  log(`Evaluation complete:`);
  log(`  - Patterns detected: ${patterns.length}`);
  log(`  - Active instincts: ${instincts.length}`);
  log(`  - Instincts removed (low confidence): ${removedCount}`);
  log(`  - Observations retained: ${recentObservations.length}`);

  process.exit(0);
}

main().catch(err => {
  log(`Error: ${err.message}`);
  process.exit(1);
});
