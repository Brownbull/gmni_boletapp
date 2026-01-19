# Claude in Chrome on WSL - Setup Guide

Quick guide to enable Claude Code's "Claude in Chrome" feature in WSL.

## The Problem

Claude Code in WSL shows:
```
Claude in Chrome is not supported in WSL at this time.
```

## Solution: Use Linux Chrome + Patch Claude Code

This approach uses Chrome installed directly in WSL (not Windows Chrome).

---

## Prerequisites

- WSL2 with Ubuntu
- Node.js installed in WSL
- Claude Code installed via npm

## Step 1: Install Chrome in WSL

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f
rm google-chrome-stable_current_amd64.deb
```

Verify:
```bash
google-chrome --version
```

## Step 2: Install Claude Code Extension

1. Start Chrome in WSL:
   ```bash
   google-chrome &
   ```

2. Go to Chrome Web Store and search for "Claude Code"

3. Install the extension

## Step 3: Patch Claude Code CLI

Claude Code blocks WSL by default. Apply this patch after every `npm update`:

```bash
perl -i -pe 's/j1Q=c1\(\(\)=>\{try\{return OA\(\)\.existsSync\("\/proc\/sys\/fs\/binfmt_misc\/WSLInterop"\)\}catch\(A\)\{return!1\}\}\)/j1Q=c1(()=>{return!1})/g; s/case"linux":return/case"wsl":case"linux":return/' ~/.npm-global/lib/node_modules/@anthropic-ai/claude-code/cli.js
```

> **Note:** Adjust the path if your npm global is elsewhere. Find it with `which claude`.

## Step 4: Run Claude Code with Chrome

1. Start Chrome:
   ```bash
   google-chrome &
   ```

2. Start Claude Code:
   ```bash
   claude
   ```

3. Test with `/chrome` - status should show "Extension: Installed"

4. Try a command:
   ```
   Go to google.com and take a screenshot
   ```

---

## Important: CLI Only - Not Available in VS Code Extension

**Chrome integration only works in the Claude Code CLI**, not in the VS Code extension.

| Environment | Chrome Support |
|-------------|----------------|
| `claude` command in terminal | ✅ Works |
| VS Code extension (Claude Code panel) | ❌ Not supported |

If you need browser automation, you must use Claude Code from the terminal:
```bash
claude
```

---

## How Chrome Integration Works (CLI)

**The `/chrome` command is a built-in CLI menu**, not a skill prefix. It opens a status/management menu for the Chrome extension.

### How to Use Browser Automation

1. **First, run `/chrome`** (alone) - This opens the Chrome menu and confirms the extension is connected
2. **Then, give browser commands normally** - Once the extension is connected, Claude should have access to Chrome MCP tools

### If Claude Doesn't Know About Chrome Tools

If you ask Claude to navigate/screenshot and it responds with "I cannot take screenshots...", the Chrome MCP tools aren't loaded in that session. This can happen because:

- The Chrome extension isn't running or connected
- The session started before Chrome was ready
- The MCP tools didn't register properly

### Troubleshooting

1. **Check extension status**: Run `/chrome` and verify it shows "Extension: Installed"
2. **Ensure Chrome is running**: The browser must be open before starting Claude Code
3. **Try reconnecting**: Use the "Reconnect extension" option in the `/chrome` menu
4. **Restart the session**: Sometimes a fresh Claude Code session is needed after Chrome is ready

### What Tools Should Be Available

When working correctly, Claude should have access to MCP tools like:
- `mcp__claude-in-chrome__navigate` - Go to URLs
- `mcp__claude-in-chrome__computer` - Screenshots, clicks, typing
- `mcp__claude-in-chrome__tabs_context_mcp` - Manage browser tabs

If Claude mentions only `WebSearch` and `WebFetch` for web tasks, the Chrome MCP tools aren't loaded.

---

## Quick Reference

### Find Claude Code CLI Path
```bash
readlink -f $(which claude)
```

### Re-apply Patch After Updates
```bash
perl -i -pe 's/j1Q=c1\(\(\)=>\{try\{return OA\(\)\.existsSync\("\/proc\/sys\/fs\/binfmt_misc\/WSLInterop"\)\}catch\(A\)\{return!1\}\}\)/j1Q=c1(()=>{return!1})/g; s/case"linux":return/case"wsl":case"linux":return/' ~/.npm-global/lib/node_modules/@anthropic-ai/claude-code/cli.js
```

### Create Auto-Patching Wrapper (Optional)
```bash
mkdir -p ~/.local/bin ~/.local/share/claude-code-wsl

cat > ~/.local/bin/claudec << 'EOF'
#!/bin/bash
CLI_PATH="$HOME/.npm-global/lib/node_modules/@anthropic-ai/claude-code/cli.js"
PATCHED_DIR="$HOME/.local/share/claude-code-wsl"
PATCHED_CLI="$PATCHED_DIR/cli.js"

mkdir -p "$PATCHED_DIR"
if [ ! -f "$PATCHED_CLI" ] || [ "$CLI_PATH" -nt "$PATCHED_CLI" ]; then
  cp "$CLI_PATH" "$PATCHED_CLI"
  perl -i -pe 's/j1Q=c1\(\(\)=>\{try\{return OA\(\)\.existsSync\("\/proc\/sys\/fs\/binfmt_misc\/WSLInterop"\)\}catch\(A\)\{return!1\}\}\)/j1Q=c1(()=>{return!1})/g' "$PATCHED_CLI"
  perl -i -pe 's/case"linux":return/case"wsl":case"linux":return/' "$PATCHED_CLI"
  echo "Patched CLI regenerated"
fi
exec node "$PATCHED_CLI" "$@"
EOF

chmod +x ~/.local/bin/claudec
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

Then use `claudec` instead of `claude` - it auto-patches after updates.

---

## Troubleshooting

### Menu options don't respond
The "Manage permissions" and "Reconnect extension" menu items may not show visible feedback. This is normal. Test with an actual command like "go to google.com".

### Native host errors
Check if the native host is configured:
```bash
cat ~/.config/google-chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json
```

Should point to:
```
~/.claude/chrome/chrome-native-host
```

### Multiple native host processes
Kill stale processes:
```bash
pkill -f "chrome-native-host"
rm -f /tmp/claude-mcp-browser-bridge-$USER
```

### Extension not detected
1. Ensure Chrome is running before using `/chrome`
2. Click the Claude Code extension icon in Chrome to activate it
3. Try "Reconnect extension" in the `/chrome` menu

---

## What the Patches Do

1. **WSL Detection Bypass**: Changes `isWslEnvironment()` to always return `false`, so the Chrome feature doesn't block WSL.

2. **Native Messaging Path**: Adds `case"wsl":` before `case"linux":` so native messaging uses the Linux path for WSL.

---

## E2E Testing with Chrome MCP

Once Chrome integration is working, you can use it for interactive E2E testing with the BMAD testarch workflow.

### BMAD Workflow

Location: `_bmad/bmm/workflows/testarch/chrome-e2e/`

This workflow provides:
- **Visual inspection** of your application with real screenshots
- **DevTools integration** for network monitoring, console logs
- **Interactive debugging** with pause, inspect, retry
- **Test generation** - convert successful sessions to Playwright tests

### Quick Start

```bash
# 1. Start Chrome
google-chrome &

# 2. Start your dev server
npm run dev

# 3. Start Claude Code CLI
claude

# 4. Verify Chrome connected
/chrome

# 5. Start testing
Go to http://localhost:5173 and take a screenshot
```

### Knowledge Base

For detailed patterns and techniques, see:
- `_bmad/bmm/testarch/knowledge/chrome-devtools-mcp.md` - Chrome MCP patterns
- `_bmad/bmm/workflows/testarch/chrome-e2e/instructions.md` - Full workflow guide

---

## References

- GitHub Issue: https://github.com/anthropics/claude-code/issues/14367
- Working as of: Claude Code v2.1.12, January 2026
- BMAD Chrome E2E Workflow: `_bmad/bmm/workflows/testarch/chrome-e2e/`
