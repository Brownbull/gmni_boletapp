#!/bin/bash
# Launch Windows Chrome from WSL
# This opens Chrome so you can install/verify the Claude extension

CHROME_PATH="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

if [ -f "$CHROME_PATH" ]; then
    echo "Launching Windows Chrome..."
    "$CHROME_PATH" &
    echo "Chrome launched. Install the Claude extension from: https://claude.ai/download"
    echo "Or go to: chrome://extensions to verify it's installed"
else
    echo "Chrome not found at: $CHROME_PATH"
    echo "Trying alternative path..."
    ALT_PATH="/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    if [ -f "$ALT_PATH" ]; then
        "$ALT_PATH" &
        echo "Chrome launched from x86 path"
    else
        echo "Chrome not found. Please verify Chrome is installed on Windows."
    fi
fi
