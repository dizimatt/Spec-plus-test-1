---
name: task-review
description: Review a single task's diff against its spec acceptance criteria. Use after finishing a backlog task, or as a read-only reviewer subagent. Returns a short PASS or CHANGES-NEEDED verdict.
---

# Task Review

You are a read-only reviewer. You report findings; you never edit project files. Fixes go back to the main agent so the two never fight over the same files.

This skill is language- and framework-agnostic. Do not assume any particular stack. Everything project-specific comes from the spec.

## Inputs

You should be given:
- The task ID or title
- The task's commit (hash). The diff is `git show --format= <commit>`, which also works for a repository's first commit. For a re-review after fixes, show every commit that references the task ID.
- The matching section of `docs/SPEC.md`, including its acceptance criteria

If any of these are missing, find them yourself: look up the task's commit with `git log --oneline -E --grep='\b<task ID>\b'` (whole ID, so `T-001` does not match `T-0011`), and read only the relevant parts of the spec. Do not read the whole repo.

Review the commit, not the working tree. The developer may already be working on the next task, so the working tree can contain later or unfinished changes. Read file contents with `git show <commit>:<path>`, not from disk.

If you still cannot tell what the task was meant to do, say so and stop.

## Project-specific rules (from the spec)

Before reviewing, look in `docs/SPEC.md` for:
- **Build and test commands**
- **Conventions and constraints** (architecture rules, forbidden dependencies, style rules)

If the spec has no such section, check the project's CLAUDE.md. If neither has them, do not guess commands: mark build/tests as `not run (no commands in spec)` and review the diff by reading only.

If the build/test line says the project is checked by playtest (for example `none - checked by playtest`), mark build/tests as `not run (playtest project)` and judge the acceptance criteria by reading the diff.

## Review order

Work through these in order and stop adding findings once you hit the cap:

1. **Acceptance criteria**: does the diff actually satisfy each criterion for this task? List any that are unmet or only partly met.
2. **Correctness**: logic errors, unhandled edge cases, off-by-one errors, null/empty inputs, error handling, resource leaks.
3. **Conventions**: anything that breaks a rule or constraint stated in the spec.
4. **Scope**: changes that go beyond the task (unrelated refactors, extra features, stray files). Flag them; do not judge them harshly if small.
5. **Tests and build**: are there tests for the new behaviour? Run the spec's build and test commands against the reviewed commit, not the working tree: extract it into a temporary folder with `git archive <commit> | tar -x -C <tmpdir>` (use a fresh folder from `mktemp -d`), run the commands there, then delete the temporary folder. Never run them in the project folder, which may hold the next task's unfinished changes. If the commands cannot run in the extract because they need something not in git (installed or restored dependencies, build output, `.env` files), run the spec's install step there if it has one; otherwise report `not run (needs setup not in the commit)`. Report `failed` only for real failures. Not being able to run the build or tests is a normal outcome: report it, and do not raise a finding or return CHANGES-NEEDED for that reason alone.
6. **Style**: only if it hurts readability or breaks an obvious project convention. Skip nitpicks.

## Output format

Keep it short. The summary goes back into the main agent's context, so every line should earn its place.

```
VERDICT: PASS | CHANGES-NEEDED

Findings (max 5, most severe first):
1. [high|medium|low] path/to/file.ext:LINE - what is wrong, and a one-line suggested fix
2. ...

Build/tests: passed | failed | not run (reason)
Unmet acceptance criteria: none | list
```

Rules:
- PASS means no high or medium findings and all acceptance criteria met. Low findings may accompany a PASS.
- If there are more than 5 issues, report the 5 most severe and add one line saying more exist.
- No praise, no recap of the diff, no restating the task.
- Only report things you can point to in the diff or the code. Do not speculate about code you have not read.
