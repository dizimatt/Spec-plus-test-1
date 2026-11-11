# Open4skills-spec

A Claude Code skill, **`/spec-plus`**, that turns a rough idea into a testable specification and task backlog through a short (~10 question) interview.

It writes `docs/SPEC.md` (requirements with stable IDs and acceptance criteria, plus a task backlog) and tunes the backlog to the LLM that will build it: a frontier model gets a plain backlog, a small local model gets atomic task cards in `docs/TASKS.md`. It also adds a pointer to the spec in your project's `CLAUDE.md`.

## Repository structure

```
Open4skills-spec/
├── README.md
├── install.sh                       # copies the skills and agent into place
└── .claude/
    ├── skills/
    │   ├── spec-plus/SKILL.md       # idea -> spec and task backlog
    │   └── task-review/SKILL.md     # review one committed task against the spec
    └── agents/
        └── task-reviewer.md         # optional read-only subagent for task-review
```

The repo uses the same layout Claude Code expects, so opening this repo in Claude Code loads the skills directly. To use them in another project, copy them there as described below.

| Item | Purpose |
|------|---------|
| `spec-plus` | Interviews you and writes `docs/SPEC.md` (and `docs/TASKS.md` for local models) |
| `task-review` | Reviews one task's commit against its acceptance criteria and returns PASS or CHANGES-NEEDED |
| `task-reviewer` (agent) | Optional. Runs `task-review` as a subagent with restricted tools, so work on the next task can continue |

## Installing

Claude Code discovers skills by looking for a folder containing a file named exactly `SKILL.md` (uppercase) inside a `skills/` directory in specific locations. The folder name becomes the slash command (`spec-plus` gives `/spec-plus`). Agents are single `.md` files in an `agents/` directory in the same places.

### Option A: personal install (available in every project)

```
~/.claude/skills/spec-plus/SKILL.md
~/.claude/skills/task-review/SKILL.md
~/.claude/agents/task-reviewer.md
```

```bash
./install.sh
```

### Option B: project install (shared with everyone working on one repo)

```
<your-project>/.claude/skills/spec-plus/SKILL.md
<your-project>/.claude/skills/task-review/SKILL.md
<your-project>/.claude/agents/task-reviewer.md
```

```bash
./install.sh /path/to/your-project
```

Or copy the folders by hand from the root of this repo:

```bash
mkdir -p /path/to/your-project/.claude
cp -r .claude/skills .claude/agents /path/to/your-project/.claude/
```

Commit `.claude/` in your project so teammates get the skills when they clone. The `task-review` skill and `task-reviewer` agent are optional; `spec-plus` works without them.

### Placement checklist

Claude Code will silently ignore a skill if any of these are wrong:

- The file is named `SKILL.md`, uppercase, not `skill.md` or `SKILL_2.md`.
- It sits one folder deep: `.../skills/spec-plus/SKILL.md`, not `.../skills/SKILL.md`.
- The folder is under `.claude/skills/` (note the leading dot), either in your home directory or at the root of the project.
- The YAML front matter at the top of the file is intact (`name` and `description`, between `---` lines).
- Agent files sit directly in `.claude/agents/`, for example `.claude/agents/task-reviewer.md`.

## Verifying it works

1. Start a **new** Claude Code session in your project (restart if one is already open, since skills are loaded at startup).
2. Type `/` and look for `spec-plus` in the list, or ask "what skills are available?".
3. Run it:

   ```
   /spec-plus a plugin that shows related posts under each article
   ```

   If you pass an idea, the first question is skipped. With no argument it asks for the idea first.

If `/spec-plus` does not appear, re-check the placement checklist above.

## What it produces

| File | When |
|------|------|
| `docs/SPEC.md` | Always. Requirements (`R-xxx`), acceptance criteria, scope, assumptions, task backlog (`T-xxx`), change log |
| `docs/TASKS.md` | Only when the builder model is a local model (tiers B-D). One self-contained task card per task |
| `CLAUDE.md` | Created or appended with a pointer to the spec (and task cards for tiers B-D) |

After you approve the spec, say things like "build T-001" and Claude works from `docs/SPEC.md`.

## Builder model tiers

| Tier | Builder | Backlog style |
|------|---------|---------------|
| A | Frontier API model (Claude Sonnet/Opus) | Feature-sized one-liners |
| B | Large local model (over ~40B) | One file or module per task, with cards |
| C | Mid local model (~16-40B) | One file or module per task, with cards |
| D | Small local model (up to ~15B) | Atomic tasks (under ~150 lines) with exact paths, signatures and runnable checks |

If you use Aider or Cline, load `docs/SPEC.md` and the current task card as read-only context, since those tools do not read `CLAUDE.md`.

## Reviewing tasks (optional)

With `task-review` installed in the project, commit each task on its own (with the task ID in the message), then say "review T-003". Claude runs the review on that commit, ideally through the `task-reviewer` agent, while you carry on with the next task.

- Only one review runs at a time.
- Only start the next task during a review if it does not depend on the task being reviewed.
- Task status moves `todo` to `in-review` to `done`. A CHANGES-NEEDED verdict sends the task back to `todo` until it is fixed and re-reviewed.
- The reviewer reads the build and test commands from section 5 of `docs/SPEC.md`.

You can also skip the agent file and just ask Claude to "spawn a subagent and follow the task-review skill for T-003"; the agent file adds restricted tools.

## Updating

Edit the files under `.claude/` in this repo, then re-run `./install.sh` (or copy them again) and start a new Claude Code session.
