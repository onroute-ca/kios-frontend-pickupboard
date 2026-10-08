#!/bin/bash

set -euo pipefail

# Read Claude's tool input.
input=$(cat)

# Extract the Bash command.
command_string=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

# Nothing to inspect.
if [[ -z "$command_string" ]]; then
    exit 0
fi

# A shell joins "\" + newline before executing the command.
command_string=${command_string//\\$'\n'/ }

# Normalize common Git global options so:
#   git -C repo push
#   git --no-pager -C repo push
# are still detected as Git commands.
check=$(printf '%s' "$command_string" |
    sed -E \
        -e ':a' \
        -e 's/(^|[;&|[:space:]])git[[:space:]]+((-C|-c)[[:space:]]+[^[:space:]]+|--(git-dir|work-tree|namespace|exec-path)=[^[:space:]]+|--(no-pager|paginate|bare))[[:space:]]+/\1git /g' \
        -e 'ta'
)

# ---------------------------------------------------------------------------
# 1. BLOCK COMMIT BYPASS
# ---------------------------------------------------------------------------

if printf '%s' "$check" | grep -qE \
    '(^|[;&|[:space:]])git[[:space:]]+commit([^[:alnum:]_]|$)|(^|[;&|[:space:]])--no-verify([^[:alnum:]_]|$)|(^|[;&|[:space:]])-n([^[:alnum:]_]|$)'; then

    echo "BLOCKED: Git commit or verification bypass is not allowed." >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# 2. BLOCK DESTRUCTIVE GIT OPERATIONS
# ---------------------------------------------------------------------------

# git reset --hard
if printf '%s' "$check" | grep -qE \
    '(^|[;&|[:space:]])git[[:space:]]+reset([^;&|]*[[:space:]])--hard([^[:alnum:]_]|$)'; then

    echo "BLOCKED: git reset --hard is not allowed." >&2
    exit 2
fi

# git clean -f / -fd / -fdx etc.
if printf '%s' "$check" | grep -qE \
    '(^|[;&|[:space:]])git[[:space:]]+clean([^;&|]*[[:space:]])-[^[:space:]]*f'; then

    echo "BLOCKED: Destructive git clean operation is not allowed." >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# 3. BLOCK FORCE PUSH
# ---------------------------------------------------------------------------

# Covers:
#   git push --force
#   git push --force-with-lease
#   git push -f
#   git push -uf
#   git push origin +main
#   git push origin +HEAD:main
#
if printf '%s' "$check" | grep -qE \
    '(^|[;&|[:space:]])git[[:space:]]+push([^;&|]*)(--force-with-lease([^[:alnum:]_]|$)|--force([^[:alnum:]_]|$)|-[a-zA-Z]*f([^[:alnum:]_]|$)|[[:space:]]\+[A-Za-z0-9._/*:-]+)'; then

    echo "BLOCKED: Force-push is not allowed." >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# 4. BLOCK PUSH TO PROTECTED BRANCHES
# ---------------------------------------------------------------------------

# Add/remove protected branches here as required.
PROTECTED_BRANCHES='main|master|develop'

if printf '%s' "$check" | grep -qE \
    "git[[:space:]]+push([^;&|]*)(^|[[:space:]:/])($PROTECTED_BRANCHES)([^[:alnum:]_-]|$)"; then

    echo "BLOCKED: Direct push to a protected branch is not allowed." >&2
    exit 2
fi

# Also detect common refspec forms:
#   origin main
#   origin HEAD:main
#   origin refs/heads/main
if printf '%s' "$check" | grep -qE \
    "git[[:space:]]+push([^;&|]*)(:|/|[[:space:]])($PROTECTED_BRANCHES)([^[:alnum:]_-]|$)|git[[:space:]]+push([^;&|]*)HEAD:($PROTECTED_BRANCHES)([^[:alnum:]_-]|$)"; then

    echo "BLOCKED: Direct push to a protected branch is not allowed." >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# 5. BLOCK PUSHING ALL BRANCHES / MIRROR
# ---------------------------------------------------------------------------

if printf '%s' "$check" | grep -qE \
    'git[[:space:]]+push([^;&|]*)(--all([^[:alnum:]_]|$)|--mirror([^[:alnum:]_]|$))'; then

    echo "BLOCKED: Pushing all branches or mirroring the repository is not allowed." >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# 6. BLOCK GIT REBASE THAT CAN REWRITE HISTORY
# ---------------------------------------------------------------------------

if printf '%s' "$check" | grep -qE \
    '(^|[;&|[:space:]])git[[:space:]]+rebase([^;&|]*)(--onto|--root|--exec|--rebase-merges|-i|--interactive)'; then

    echo "BLOCKED: History-rewriting git rebase operation is not allowed." >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# 7. BLOCK GIT FILTER/REWRITE OPERATIONS
# ---------------------------------------------------------------------------

if printf '%s' "$check" | grep -qE \
    '(^|[;&|[:space:]])git[[:space:]]+(filter-branch|filter-repo|replace)([^[:alnum:]_]|$)'; then

    echo "BLOCKED: Git history rewriting operation is not allowed." >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# SAFE
# ---------------------------------------------------------------------------

exit 0