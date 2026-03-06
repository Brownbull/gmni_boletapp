#!/usr/bin/env python3
"""Orphaned reference detector — P6 pattern enforcement (Tier 2).

Scans recently changed files for path-like references and verifies
targets exist on disk. Called from step-06-validation.md during
consolidated validation, NOT as a hook (too expensive per-edit).

Value: Structural Humility — "Map to a demolished building"

Exit 0 = clean. Exit 1 = orphaned refs found (prints to stderr).
"""
import os
import re
import subprocess
import sys


# Patterns that look like file references in markdown/yaml/json
REF_PATTERNS = [
    # `path/to/file.ext` in markdown
    re.compile(r"`([^`\s]+\.[a-z]{1,5})`"),
    # [link text](path/to/file.ext) in markdown
    re.compile(r"\[.*?\]\(([^)]+\.[a-z]{1,5})\)"),
    # path: "file.ext" or path: file.ext in yaml
    re.compile(r"path:\s*[\"']?([^\s\"']+\.[a-z]{1,5})"),
    # source/load references
    re.compile(r"(?:source|load|read|from):\s*[\"']?([^\s\"']+\.[a-z]{1,5})"),
]

# Skip these patterns — not local file references
SKIP_PREFIXES = (
    "http://", "https://", "node_modules/",
    "@", "#", "{{", "<", "mailto:", "git@",
)

# Only scan these file types for references
SCANNABLE_EXTENSIONS = (".md", ".yaml", ".yml", ".json", ".xml")

# Only check references within these directories (template-safe)
CHECKABLE_PREFIXES = (
    "_kdbp/", "_ecc/", ".claude/", "behaviors/", "docs/",
    "src/", "scripts/",
)

# Default commit depth for changed file detection
DEFAULT_DEPTH = int(os.environ.get("KDBP_REF_DEPTH", "10"))


def get_changed_files(project_dir, depth=None):
    """Get files changed in recent commits (committed + uncommitted)."""
    if depth is None:
        depth = DEFAULT_DEPTH
    changed = set()
    try:
        # Committed changes across last N commits
        result = subprocess.run(
            ["git", "log", "--name-only", "--diff-filter=ACRM",
             "--pretty=format:", f"HEAD~{depth}..HEAD"],
            capture_output=True, text=True, cwd=project_dir, timeout=10,
        )
        if result.returncode == 0:
            changed.update(f.strip() for f in result.stdout.splitlines() if f.strip())

        # Also check uncommitted changes (staged + unstaged)
        for cmd in [["git", "diff", "--name-only"],
                    ["git", "diff", "--name-only", "--cached"]]:
            result = subprocess.run(
                cmd, capture_output=True, text=True, cwd=project_dir, timeout=10,
            )
            if result.returncode == 0:
                changed.update(f.strip() for f in result.stdout.splitlines() if f.strip())

    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return list(changed)


def resolve_ref(ref, source_file_dir, project_dir):
    """Resolve a reference path, handling relative paths."""
    if ref.startswith("./") or ref.startswith("../"):
        # Resolve relative to the source file's directory
        resolved = os.path.normpath(os.path.join(source_file_dir, ref))
        # Convert back to project-relative for prefix checking
        if resolved.startswith(project_dir):
            return resolved[len(project_dir):].lstrip("/")
        return resolved
    return ref


def extract_refs(content):
    """Extract path-like references from file content."""
    refs = []
    for pattern in REF_PATTERNS:
        for match in pattern.finditer(content):
            ref = match.group(1)
            if any(ref.startswith(p) for p in SKIP_PREFIXES):
                continue
            if "{" in ref:
                continue  # Skip template variables: {path}, {{name}}, etc.
            if ref.count("/") < 1:
                continue  # Skip bare filenames without path
            refs.append(ref)
    return refs


def main():
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    changed_files = get_changed_files(project_dir)

    if not changed_files:
        print("[P6-CLEAN] No changed files to scan.", file=sys.stdout)
        sys.exit(0)

    orphans = []
    scanned = 0

    for cf in changed_files:
        # Only scan scannable file types
        if not any(cf.endswith(ext) for ext in SCANNABLE_EXTENSIONS):
            continue

        full_path = os.path.join(project_dir, cf)
        if not os.path.isfile(full_path):
            continue

        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except OSError:
            continue

        scanned += 1
        source_dir = os.path.dirname(full_path)
        refs = extract_refs(content)
        for ref in refs:
            resolved = resolve_ref(ref, source_dir, project_dir)

            # Only check references within checkable directories
            if not any(resolved.startswith(p) for p in CHECKABLE_PREFIXES):
                continue

            target = os.path.join(project_dir, resolved)
            if not os.path.exists(target):
                orphans.append(f"  {cf}: references '{ref}' — target not found")

    if orphans:
        print("P6 ORPHANED REFERENCES DETECTED:", file=sys.stderr)
        print("  Handle: \"Map to a demolished building\"", file=sys.stderr)
        for o in orphans[:15]:  # Cap output at 15 findings
            print(o, file=sys.stderr)
        if len(orphans) > 15:
            print(f"  ... and {len(orphans) - 15} more", file=sys.stderr)
        print(f"[P6-FAIL: {len(orphans)} orphans]", file=sys.stdout)
        sys.exit(1)

    print(f"[P6-CLEAN] Scanned {scanned} files. 0 orphans.", file=sys.stdout)
    sys.exit(0)


if __name__ == "__main__":
    main()
