#!/usr/bin/env node
/**
 * Atlas PostToolUse Hook - Observation Capture
 * Records tool usage for pattern analysis (ECC v2 style).
 *
 * Fires on: Edit, Write, Bash, Read tool completions
 *
 * Following ECC patterns:
 * - JSONL storage for streaming analysis
 * - Payload truncation (5000 chars)
 * - Sensitive data sanitization
 * - Graceful failure
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

/**
 * Load configuration with defaults
 */
function loadConfig() {
  const defaults = {
    learning: {
      enabled: false,
      observationTruncateLength: 5000,
      maxObservationsPerSession: 1000
    },
    observations: {
      captureTools: ['Edit', 'Write', 'Bash', 'Read', 'Grep', 'Glob'],
      ignorePaths: ['node_modules/', '.git/', '*.log', 'dist/', 'coverage/'],
      sensitiveFields: ['password', 'secret', 'token', 'key', 'apiKey', 'api_key']
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
  console.error(`[Atlas Observe] ${message}`);
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
 * Check if tool should be captured
 */
function shouldCapture(toolName, toolInput, config) {
  const { captureTools, ignorePaths } = config.observations;

  // Check if tool is in capture list (empty = capture all)
  if (captureTools.length > 0 && !captureTools.includes(toolName)) {
    return false;
  }

  // Check if path should be ignored
  const filePath = toolInput?.file_path || toolInput?.path || '';
  if (filePath) {
    for (const pattern of ignorePaths) {
      // Directory pattern (ends with /)
      if (pattern.endsWith('/') && filePath.includes(pattern.slice(0, -1))) {
        return false;
      }
      // Extension pattern (starts with *)
      if (pattern.startsWith('*.') && filePath.endsWith(pattern.slice(1))) {
        return false;
      }
      // Contains pattern
      if (filePath.includes(pattern)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Sanitize sensitive fields from input
 */
function sanitizeInput(input, sensitiveFields) {
  if (!input || typeof input !== 'object') {
    return input;
  }

  const sanitized = { ...input };

  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }

    // Also check nested command field for Bash
    if (sanitized.command && typeof sanitized.command === 'string') {
      const fieldPattern = new RegExp(`${field}[=:]\\S+`, 'gi');
      sanitized.command = sanitized.command.replace(fieldPattern, `${field}=[REDACTED]`);
    }
  }

  return sanitized;
}

/**
 * Truncate payload to max length
 */
function truncatePayload(payload, maxLength) {
  if (!payload) return payload;

  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);

  if (str.length <= maxLength) {
    return payload;
  }

  if (typeof payload === 'string') {
    return payload.slice(0, maxLength) + '... [truncated]';
  }

  return { _truncated: true, preview: str.slice(0, maxLength) };
}

/**
 * Summarize tool result
 */
function summarizeResult(result, maxLength) {
  if (!result) return null;

  const str = typeof result === 'string' ? result : JSON.stringify(result);
  const isError = str.toLowerCase().includes('error') || str.toLowerCase().includes('failed');

  return {
    success: !isError,
    length: str.length,
    preview: str.slice(0, Math.min(500, maxLength))
  };
}

/**
 * Get current git branch (optional context)
 */
function getGitBranch(cwd) {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Count current observation lines
 */
function countObservations() {
  try {
    if (fs.existsSync(OBSERVATIONS_PATH)) {
      const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
      return content.split('\n').filter(line => line.trim()).length;
    }
  } catch {
    // Ignore
  }
  return 0;
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const input = await readStdin();
    const { tool_name, tool_input, tool_result, session_id, cwd } = input;

    // Skip if no tool info
    if (!tool_name) {
      process.exit(0);
    }

    const config = loadConfig();

    // Skip if learning is disabled
    if (!config.learning.enabled) {
      process.exit(0);
    }

    // Check if tool should be captured
    if (!shouldCapture(tool_name, tool_input, config)) {
      process.exit(0);
    }

    // Check observation limit
    const currentCount = countObservations();
    if (currentCount >= config.learning.maxObservationsPerSession) {
      process.exit(0);
    }

    // Build observation record
    const maxLength = config.learning.observationTruncateLength || 5000;
    const sanitizedInput = sanitizeInput(tool_input, config.observations.sensitiveFields);

    const observation = {
      timestamp: new Date().toISOString(),
      sessionId: session_id || 'unknown',
      toolName: tool_name,
      input: truncatePayload(sanitizedInput, maxLength),
      resultSummary: summarizeResult(tool_result, maxLength),
      context: {
        cwd: cwd || PROJECT_DIR,
        gitBranch: getGitBranch(cwd || PROJECT_DIR)
      }
    };

    // Ensure directory and append observation
    ensureDir(LEARNING_DIR);
    fs.appendFileSync(OBSERVATIONS_PATH, JSON.stringify(observation) + '\n');

  } catch (err) {
    // Silent failure - don't interrupt user's work
  }

  // Always exit successfully
  process.exit(0);
}

main();
