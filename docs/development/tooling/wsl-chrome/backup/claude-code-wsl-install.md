# Claude Code WSL Installation & Management Guide

## Table of Contents
- [Install Claude Code via npm in WSL](#install-claude-code-via-npm-in-wsl)
- [Uninstall Claude Code](#uninstall-claude-code)
- [Complete Cleanup](#complete-cleanup---remove-all-claude-related-files)
- [Backup & Restore](#backup--restore-config)
- [Windows Cleanup](#windows-side-cleanup-for-bridge-setup)

---

## Install Claude Code via npm in WSL

### Option 1: Global Install (Recommended)
```bash
sudo npm install -g @anthropic-ai/claude-code
```

After install, run:
```bash
claude
```

### Option 2: User-Local Install (No sudo)
```bash
npm install --prefix ~/.local @anthropic-ai/claude-code
```

The CLI will be at:
```
~/.local/node_modules/@anthropic-ai/claude-code/cli.js
```

Run with:
```bash
node ~/.local/node_modules/@anthropic-ai/claude-code/cli.js
```

Or create an alias in `~/.bashrc`:
```bash
alias claude='node ~/.local/node_modules/@anthropic-ai/claude-code/cli.js'
```

---

## Uninstall Claude Code

### Uninstall npm Global Version
```bash
sudo npm uninstall -g @anthropic-ai/claude-code
```

### Uninstall npm User-Local Version
```bash
npm uninstall --prefix ~/.local @anthropic-ai/claude-code
rm -rf ~/.local/node_modules/@anthropic-ai/claude-code
```

### Uninstall Binary Version
```bash
rm -rf ~/.local/share/claude
rm -f ~/.local/bin/claude
```

---

## Complete Cleanup - Remove ALL Claude-related Files

**WARNING: This removes all Claude Code data including sessions, history, credentials, and plugins!**

### One-liner (copy and paste):
```bash
rm -rf ~/.local/share/claude ~/.local/bin/claude ~/.claude ~/.local/node_modules/@anthropic-ai/claude-code ~/.local/bin/claudec ~/.local/share/claude-code-wsl ~/.config/google-chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json && sudo npm uninstall -g @anthropic-ai/claude-code 2>/dev/null; echo "Claude Code completely removed"
```

### Step by step:
```bash
# 1. Remove Claude Code binary installation
rm -rf ~/.local/share/claude
rm -f ~/.local/bin/claude

# 2. Remove npm installation (global)
sudo npm uninstall -g @anthropic-ai/claude-code

# 3. Remove npm installation (user-local)
rm -rf ~/.local/node_modules/@anthropic-ai/claude-code

# 4. Remove ALL Claude config, cache, sessions, and data
rm -rf ~/.claude

# 5. Remove Chrome native messaging host config (Linux Chrome)
rm -f ~/.config/google-chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# 6. Remove any patched wrapper (if created)
rm -f ~/.local/bin/claudec
rm -rf ~/.local/share/claude-code-wsl
```

---

## Backup & Restore Config

### Backup Files Location
Config files backed up to: `docs/uxui/cc_chrome/backup/`
- `settings.json` - permissions and enabled plugins
- `.credentials.json` - authentication (**DO NOT SHARE/COMMIT**)
- `installed_plugins.json` - installed plugins list

### Create Backup
```bash
mkdir -p docs/uxui/cc_chrome/backup
cp ~/.claude/settings.json docs/uxui/cc_chrome/backup/
cp ~/.claude/.credentials.json docs/uxui/cc_chrome/backup/
cp ~/.claude/plugins/installed_plugins.json docs/uxui/cc_chrome/backup/
```

### Restore After Reinstall
```bash
# After fresh install, copy back settings
mkdir -p ~/.claude
cp docs/uxui/cc_chrome/backup/settings.json ~/.claude/
cp docs/uxui/cc_chrome/backup/.credentials.json ~/.claude/
```

---

## Windows Side Cleanup (for bridge setup)

If you set up the Windows Chrome bridge, clean up these files:

### Delete files in Windows Explorer:
```
C:\Users\Gabe\AppData\Local\Google\Chrome\User Data\NativeMessagingHosts\com.anthropic.claude_code_browser_extension.bat
C:\Users\Gabe\AppData\Local\Google\Chrome\User Data\NativeMessagingHosts\com.anthropic.claude_code_browser_extension.json
C:\Users\Gabe\AppData\Local\Google\Chrome\User Data\NativeMessagingHosts\add_registry.bat
C:\Users\Gabe\AppData\Local\Google\Chrome\User Data\NativeMessagingHosts\install_registry.reg
```

### Remove registry entry (run in PowerShell as Admin):
```powershell
reg delete "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_code_browser_extension" /f
```

---

## Important Notes

1. **Add to .gitignore**: `docs/uxui/cc_chrome/backup/.credentials.json`
2. **Never commit credentials** - the `.credentials.json` file contains your auth token
3. **After reinstall**, you'll need to re-authenticate with `claude` command
