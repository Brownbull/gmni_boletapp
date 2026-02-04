#!/usr/bin/env node
/**
 * Atlas Session End Hook
 * Persists session state and triggers learning evaluation.
 *
 * Fires on: session clear
 *
 * Following ECC patterns:
 * - Graceful failure (exit 0 on error)
 * - Cross-platform (Node.js)
 * - Config-driven behavior
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Resolve Atlas paths relative to project
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const ATLAS_ROOT = path.join(PROJECT_DIR, '_bmad/agents/atlas');
const SIDECAR_DIR = path.join(ATLAS_ROOT, 'atlas-sidecar');
const LEARNING_DIR = path.join(SIDECAR_DIR, 'learning');
const CONFIG_PATH = path.join(LEARNING_DIR, 'config.json');
const SESSION_STATE_PATH = path.join(LEARNING_DIR, 'session-state.tmp');
const OBSERVATIONS_PATH = path.join(LEARNING_DIR, 'observations.jsonl');

/**
 * Load configuration with defaults
 */
function loadConfig() {
  const defaults = {
    learning: {
      enabled: false,
      sessionEvaluationThreshold: 10
    },
    hooks: {
      sessionEnd: {
        persistState: true,
        triggerEvaluation: true
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
  console.error(`[Atlas SessionEnd] ${message}`);
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Count observations in the session
 */
function countObservations() {
  try {
    if (fs.existsSync(OBSERVATIONS_PATH)) {
      const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
      return content.split('\n').filter(line => line.trim()).length;
    }
  } catch {
    // Ignore errors
  }
  return 0;
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const input = await readStdin();
    const { reason, session_id, transcript_summary } = input;

    const config = loadConfig();

    // Skip if learning is disabled
    if (!config.learning.enabled) {
      process.exit(0);
    }

    const hookConfig = config.hooks.sessionEnd;

    // Persist session state
    if (hookConfig.persistState) {
      ensureDir(LEARNING_DIR);

      const state = {
        sessionId: session_id || 'unknown',
        endedAt: new Date().toISOString(),
        reason: reason || 'unknown',
        lastTask: transcript_summary?.slice(0, 500) || 'Session ended',
        observationCount: countObservations()
      };

      fs.writeFileSync(SESSION_STATE_PATH, JSON.stringify(state, null, 2));
      log(`Session state persisted (${state.observationCount} observations)`);
    }

    // Trigger evaluation if threshold met
    if (hookConfig.triggerEvaluation) {
      const observationCount = countObservations();
      const threshold = config.learning.sessionEvaluationThreshold || 10;

      if (observationCount >= threshold) {
        const evaluatorPath = path.join(ATLAS_ROOT, 'hooks/evaluate-session.cjs');

        if (fs.existsSync(evaluatorPath)) {
          try {
            // Run evaluation synchronously but don't fail if it errors
            execSync(`node "${evaluatorPath}"`, {
              stdio: 'pipe',
              timeout: 30000 // 30 second timeout
            });
            log(`Evaluation triggered (${observationCount} observations)`);
          } catch (evalErr) {
            log(`Evaluation error: ${evalErr.message}`);
          }
        }
      } else {
        log(`Skipping evaluation (${observationCount} < ${threshold} threshold)`);
      }
    }

  } catch (err) {
    log(`Error: ${err.message}`);
  }

  // Always exit successfully
  process.exit(0);
}

main();
