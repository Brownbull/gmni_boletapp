#!/usr/bin/env node
/**
 * Atlas Session Start Hook
 * Loads recent context and active instincts at session beginning.
 *
 * Fires on: startup, resume, compact
 *
 * Following ECC patterns:
 * - Graceful failure (exit 0 on error)
 * - Cross-platform (Node.js)
 * - Config-driven behavior
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Resolve Atlas paths relative to project
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const ATLAS_ROOT = path.join(PROJECT_DIR, '_bmad/agents/atlas');
const SIDECAR_DIR = path.join(ATLAS_ROOT, 'atlas-sidecar');
const LEARNING_DIR = path.join(SIDECAR_DIR, 'learning');
const CONFIG_PATH = path.join(LEARNING_DIR, 'config.json');
const INSTINCTS_PATH = path.join(LEARNING_DIR, 'instincts.json');
const SESSION_STATE_PATH = path.join(LEARNING_DIR, 'session-state.tmp');

/**
 * Load configuration with defaults
 */
function loadConfig() {
  const defaults = {
    learning: { enabled: false },
    hooks: {
      sessionStart: {
        loadRecentContext: true,
        includeActiveInstincts: true,
        minInstinctConfidence: 0.6,
        maxContextTokens: 2000
      }
    }
  };

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return { ...defaults, ...config };
    }
  } catch (err) {
    log(`Config load error: ${err.message}`);
  }
  return defaults;
}

/**
 * Read JSON from stdin (Claude Code hook input)
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');

    // Handle empty stdin gracefully
    const timeout = setTimeout(() => resolve({}), 100);

    process.stdin.on('data', (chunk) => {
      clearTimeout(timeout);
      data += chunk;
    });

    process.stdin.on('end', () => {
      clearTimeout(timeout);
      try {
        resolve(data.trim() ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });

    process.stdin.on('error', () => {
      clearTimeout(timeout);
      resolve({});
    });
  });
}

/**
 * Log message to stderr (visible in Claude Code)
 */
function log(message) {
  console.error(`[Atlas SessionStart] ${message}`);
}

/**
 * Output context to stdout (injected into Claude)
 */
function output(text) {
  console.log(text);
}

/**
 * Load session state from previous session
 */
function loadSessionState() {
  try {
    if (fs.existsSync(SESSION_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(SESSION_STATE_PATH, 'utf8'));
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Load active instincts with high confidence
 */
function loadActiveInstincts(minConfidence) {
  try {
    if (fs.existsSync(INSTINCTS_PATH)) {
      const instincts = JSON.parse(fs.readFileSync(INSTINCTS_PATH, 'utf8'));
      return instincts.filter(i => i.confidence >= minConfidence);
    }
  } catch {
    // Ignore errors
  }
  return [];
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const input = await readStdin();
    const { source, session_id } = input;

    const config = loadConfig();

    // Skip if learning is disabled
    if (!config.learning.enabled) {
      process.exit(0);
    }

    const hookConfig = config.hooks.sessionStart;
    const contextParts = [];

    // Load session state if resuming
    if (hookConfig.loadRecentContext) {
      const sessionState = loadSessionState();
      if (sessionState) {
        const lastTask = sessionState.lastTask || 'previous work';
        const endedAt = sessionState.endedAt ? new Date(sessionState.endedAt).toLocaleString() : 'unknown';
        contextParts.push(`[Atlas] Previous session ended at ${endedAt}`);
        contextParts.push(`[Atlas] Last activity: ${lastTask}`);
      }
    }

    // Load active instincts
    if (hookConfig.includeActiveInstincts) {
      const minConfidence = hookConfig.minInstinctConfidence || 0.6;
      const activeInstincts = loadActiveInstincts(minConfidence);

      if (activeInstincts.length > 0) {
        contextParts.push('');
        contextParts.push('[Atlas Learned Patterns - Apply When Relevant]');
        activeInstincts.slice(0, 10).forEach(instinct => {
          contextParts.push(`- ${instinct.pattern} (confidence: ${instinct.confidence.toFixed(2)})`);
        });

        if (activeInstincts.length > 10) {
          contextParts.push(`- ... and ${activeInstincts.length - 10} more patterns`);
        }
      }
    }

    // Output context if any
    if (contextParts.length > 0) {
      output(contextParts.join('\n'));
      log(`Injected ${contextParts.length} context items`);
    }

  } catch (err) {
    log(`Error: ${err.message}`);
  }

  // Always exit successfully to not block Claude
  process.exit(0);
}

main();
