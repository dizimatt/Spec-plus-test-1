#!/usr/bin/env bash
# Install the spec-plus and task-review skills and the task-reviewer agent for Claude Code.
#   ./install.sh                  -> personal install (~/.claude/), all projects
#   ./install.sh /path/to/project -> project install (<project>/.claude/)
set -euo pipefail

src="$(cd "$(dirname "$0")" && pwd)/.claude"
if [ $# -ge 1 ]; then
  dest="$1/.claude"
else
  dest="$HOME/.claude"
fi

for skill in spec-plus task-review; do
  mkdir -p "$dest/skills/$skill"
  cp "$src/skills/$skill/SKILL.md" "$dest/skills/$skill/SKILL.md"
done
mkdir -p "$dest/agents"
cp "$src/agents/task-reviewer.md" "$dest/agents/task-reviewer.md"

echo "Installed spec-plus, task-review and task-reviewer to $dest"
echo "Restart Claude Code (or start a new session), then run /spec-plus"
