Claude Code Chrome Integration from WSL
=======================================

This guide explains how to set up Claude Code running in WSL (Windows Subsystem
for Linux) to control Chrome on Windows.

PROBLEM
-------
By default, Claude Code in WSL cannot use the "Claude in Chrome" feature and
fails with:

    Error: Claude in Chrome Native Host not supported on this platform

This happens because the platform detection explicitly blocks WSL from using
Chrome integration.

SOLUTION
--------
Create a bridge that forwards Chrome's Native Messaging from Windows to the
WSL Claude Code native host.

PREREQUISITES
-------------
- Windows 10/11 with WSL2
- Google Chrome installed on Windows
- Claude Code installed in WSL (via npm)
- Claude browser extension installed in Chrome (from https://claude.ai/chrome)

SETUP INSTRUCTIONS
==================

Step 1: Gather Information
--------------------------
First, get your Windows username and WSL distro name.

Windows username - Open PowerShell or Command Prompt and run:

    echo %USERNAME%

WSL distro name - From WSL terminal, run:

    cmd.exe /c "wsl.exe -l -q" 2>&1 | tr -d '\r' | tr -d '\0'

Common distro names include Ubuntu, Ubuntu-22.04, Ubuntu-24.04, etc.

*** IMPORTANT ***
The distro name must match exactly. "Ubuntu" and "Ubuntu-24.04" are different
distros. Using the wrong name will cause silent failures.

WSL username - From WSL terminal, run:

    whoami

Step 2: Verify the Native Host Exists
-------------------------------------
Confirm the Claude Code native host script exists:

    ls -la ~/.claude/chrome/chrome-native-host

You should see the file. If it doesn't exist, run "claude --chrome" once to
generate it, then exit.

Step 3: Create the NativeMessagingHosts Directory
-------------------------------------------------
Create the directory where Chrome looks for native messaging configurations:

    mkdir -p "/mnt/c/Users/<WINDOWS_USER>/AppData/Local/Google/Chrome/User Data/NativeMessagingHosts"

Replace <WINDOWS_USER> with your Windows username.

Step 4: Create the Batch File Bridge
------------------------------------
Create a batch file that bridges Windows Chrome to WSL.

File location:
    C:\Users\<WINDOWS_USER>\AppData\Local\Google\Chrome\User Data\NativeMessagingHosts\com.anthropic.claude_code_browser_extension.bat

Contents:

    @echo off
    wsl.exe -d <WSL_DISTRO> -- /home/<WSL_USER>/.claude/chrome/chrome-native-host

Replace:
- <WSL_DISTRO> with your WSL distro name (e.g., Ubuntu-24.04)
- <WSL_USER> with your WSL username

*** CRITICAL ***
The distro name must match exactly what "wsl -l -q" shows. This was the main
issue encountered during setup.

Step 5: Create the JSON Configuration
-------------------------------------
Create the native messaging host manifest.

File location:
    C:\Users\<WINDOWS_USER>\AppData\Local\Google\Chrome\User Data\NativeMessagingHosts\com.anthropic.claude_code_browser_extension.json

Contents:

    {
      "name": "com.anthropic.claude_code_browser_extension",
      "description": "Claude Code Browser Extension Native Host",
      "path": "C:\\Users\\<WINDOWS_USER>\\AppData\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\com.anthropic.claude_code_browser_extension.bat",
      "type": "stdio",
      "allowed_origins": [
        "chrome-extension://fcoeoabgfenejglbffodgkkbkcdhcgfn/"
      ]
    }

Replace <WINDOWS_USER> with your Windows username. Note the double backslashes
(\\) in the path.

Step 6: Add the Registry Entry
------------------------------
Chrome needs a registry entry to find the native messaging host.

Option A: Create a .reg file (Recommended)

Create a file named "claude-chrome-wsl.reg" with:

    Windows Registry Editor Version 5.00

    [HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_code_browser_extension]
    @="C:\\Users\\<WINDOWS_USER>\\AppData\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\com.anthropic.claude_code_browser_extension.json"

Replace <WINDOWS_USER> with your Windows username. Double-click the file to
import it.

Option B: Create via batch file

If the .reg file doesn't work, create a batch file named "add-registry.bat":

    @echo off
    reg add "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_code_browser_extension" /ve /t REG_SZ /d "C:\Users\<WINDOWS_USER>\AppData\Local\Google\Chrome\User Data\NativeMessagingHosts\com.anthropic.claude_code_browser_extension.json" /f
    pause

Replace <WINDOWS_USER> and double-click to run.

Step 7: Verify the Registry Entry
---------------------------------
*** STRONGLY RECOMMENDED ***

Verify the registry key manually using Registry Editor (regedit.exe).
Command-line verification from WSL often fails due to escaping issues, even
when the key exists.

1. Press Win + R, type "regedit", press Enter
2. Navigate to:
   HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_code_browser_extension
3. Verify the (Default) value contains the full path to your JSON file

If the key doesn't exist, create it manually:
1. Navigate to HKEY_CURRENT_USER\Software\Google\Chrome
2. Right-click -> New -> Key -> name it "NativeMessagingHosts"
3. Right-click on NativeMessagingHosts -> New -> Key -> name it
   "com.anthropic.claude_code_browser_extension"
4. Double-click (Default) and set the value to your JSON file path

Step 8: Restart Chrome and Test
-------------------------------
1. Close all Chrome windows
2. Open Task Manager and end any remaining Chrome processes
3. Reopen Chrome
4. From WSL, run:

    claude --chrome

TROUBLESHOOTING
===============

"Browser extension is not connected"
------------------------------------
1. Verify the Claude extension is installed and enabled
   - Go to chrome://extensions
   - Ensure the Claude extension is present and enabled

2. Verify the registry key exists
   - Open Registry Editor (regedit.exe)
   - Navigate to:
     HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_code_browser_extension
   - The (Default) value should point to your JSON file

3. Verify the WSL distro name is correct
   - This is the most common issue
   - Run "wsl -l -q" from Command Prompt to get the exact name
   - Update the batch file with the exact name (case-sensitive)

4. Test WSL invocation from Windows
   - Open Command Prompt
   - Run: wsl.exe -d <YOUR_DISTRO> -- echo test
   - Should print "test". If you get "no distribution with the supplied name",
     the distro name is wrong

5. Verify file paths exist
   - Check that ~/.claude/chrome/chrome-native-host exists in WSL
   - Check that the batch and JSON files exist in NativeMessagingHosts folder

Connection works once then drops
--------------------------------
This can happen if there are timing issues. Usually reconnecting works. If it
persists, try restarting Chrome completely.

Registry commands fail from WSL
-------------------------------
Command-line registry operations from WSL often fail due to path escaping
issues. This doesn't mean the registry key doesn't exist. Always verify using
Registry Editor (regedit.exe) directly.

HOW IT WORKS
============
1. Chrome extension tries to communicate with a native messaging host
2. Chrome looks up the registry to find the host configuration
3. The JSON config points to the batch file
4. The batch file runs wsl.exe which calls the Claude Code native host in WSL
5. The native host communicates with Claude Code running in WSL
6. Messages flow back through the same path

REFERENCES
==========
- Original GitHub issue:
  https://github.com/anthropics/claude-code/issues/14367
- Solution comment:
  https://github.com/anthropics/claude-code/issues/14367#issuecomment-3733049468
