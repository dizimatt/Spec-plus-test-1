---
name: "spec-plus"
description: "Turn a rough idea into a testable spec (docs/SPEC.md) and task backlog via a short interview, tuned to the LLM that will build it. Use for /spec-plus or when someone wants an idea specified before building."
---

# /spec-plus — idea to spec in about 10 questions, tuned to the builder model

The user has an idea but does not want to write a specification. Interview them briefly, then write the spec for them. They are the sole product owner: they decide scope, you draft. One question asks which LLM will implement the spec; the answer decides how the task backlog is written. A frontier builder gets a plain backlog, and a small local model gets atomic task cards.

## Ground rules

- Ask **one question at a time**. Never batch questions.
- Keep to **about 10 questions** in total. Stop earlier if you have enough.
- Weight questions toward the **end-user experience**: who uses it, what they are trying to do, what the core journey feels like, what "done" looks like. Technical questions get at most 1-2 slots; the builder-model question is one of them.
- **Prefer defaults over interrogation.** If the user has no strong view, propose a sensible default, label it `Assumption`, and move on. Never make the user decide something minor.
- If the user passed an idea with the command (`/spec-plus <idea>`), use it and skip the opening question. Otherwise the first question asks for the idea in their own words.
- Short questions, plain language, no product-management jargon.
- Where it helps, offer 2-4 concrete options plus "something else" so they can answer quickly.

## Step 1: Detect the project type

From the idea, infer the type (WordPress/web plugin, web app, PC game, retro/8-bit coding exercise, CLI/tool, other). If it is genuinely unclear, ask one question to settle it. The type only changes which 2-3 questions you swap in (see below); the output format is identical for every type.

## Step 2: The interview (about 10 questions)

Cover these topics in roughly this order, adapting wording to the project. Skip any the idea already answers.

1. **The idea** — what is it, in the user's own words? (Skip if supplied.)
2. **The problem / purpose** — what need or itch does it address, or what makes it worth building?
3. **The user** — who uses it? (For personal projects this may just be "me", and that is a valid answer.)
4. **The core journey** — walk through the main thing a user does, start to finish.
5. **Must-haves for the MVP** — what is the smallest version that would feel worthwhile?
6. **Explicitly out of scope** — what should the first version NOT do?
7. **What "done" feels like** — how will the user know the MVP works and is good enough?
8. **Edge cases and failure** — what should happen when things go wrong or input is odd? (Propose defaults.)
9. **Type-specific questions** (pick 2-3 from the bank below).
10. **Builder model and constraints** — which LLM builds it (Step 3), plus any required tools, platforms, languages, or things to avoid, and the commands to build and test it (or "none" for projects checked by playtest). Propose defaults based on what you can see in the repo.

### Type-specific question bank

- **WordPress / web plugin:** Who configures it vs who sees its output? Which hooks, post types or REST endpoints does it touch? Admin UI needed, or code-only? Compatibility targets (WP/PHP versions, WooCommerce)?
- **PC game:** What is the core loop (what do you do second to second)? What should it *feel* like (reference games are useful)? What does a finished first level or session look like? Input and platform?
- **Retro coding (C64, Amiga, etc.):** Target hardware and variant? Memory, raster/cycle and tooling limits (assembler, emulator)? What is the visible proof that it works (e.g. scrolling background, sprite on screen)? What is the stretch goal?
- **App / tool / CLI:** Where does data live? Who or what does it integrate with? What does the first-run experience look like?

Many games and retro projects cannot be fully auto-tested. For those, write acceptance criteria as observable behaviours a person can check in a playtest.

## Step 3: Ask which model will build it

Ask: "Which LLM will build this from the spec?" Offer:

- A. Frontier API model (e.g. Claude Sonnet or Opus) — default
- B. Large local model (over ~40B parameters)
- C. Mid local model (~16-40B)
- D. Small local model (up to ~15B, e.g. Qwen 14B)
- E. Not sure / mixed

If the answer is a local model, ask one follow-up: model name and quantisation if known, context window, and the agent tool used (Aider, Cline, Continue, Claude Code on a local endpoint, other). Default to a 16k context if unknown. Label anything proposed as `Assumption`. If E, default to tier D, since a spec a small model can follow also works for a larger one.

Record the answer in section 5 of the spec as `Builder model: <name> (tier A-D), context <n>, tool <x>`.

## Step 4: Write docs/SPEC.md

Create `docs/SPEC.md` (create the folder if needed). Use this structure exactly:

```
# <Project name> — Specification

Status: Draft | Approved   Version: 0.1   Date: <today>

## 1. Summary
2-4 sentences: what it is, who it is for, why it exists.

## 2. Users and core journey
Who uses it, and the main journey as numbered steps.

## 3. Requirements
### R-001 <short title>
- Priority: Must | Should | Could
- Description: ...
- Acceptance criteria:
  - [ ] Testable, observable statement
  - [ ] ...
- Origin: Stated | Assumption

(Continue R-002, R-003 ... Every in-scope feature gets a stable ID. IDs are never reused or renumbered.)

## 4. Out of scope
Bullet list of things deliberately excluded from this version.

## 5. Constraints and technical notes
Platforms, tools, limits, preferences. Keep short. Include the Builder model line and a build/test line:
`Build/test commands: <build command>; <test command>` (or `none - checked by playtest`). The `task-review` skill reads this line.

## 6. Assumptions and open questions
- A-001 <assumption> — proposed default, needs confirmation
- Q-001 <open question>

## 7. Task backlog
- T-001 <task> — Requirements: R-001 — Status: todo | in-review | done
- T-002 ...
(Each task references at least one requirement ID. Order tasks so the earliest ones produce something runnable.)

## 8. Change log
- 0.1 — Initial draft from /spec-plus interview.
```

Rules for writing it:
- Mark every requirement `Origin: Stated` (the user said it) or `Origin: Assumption` (you proposed it). Never present an assumption as a fact.
- Acceptance criteria must be checkable by a person or a test. Avoid vague words like "fast", "intuitive", "nice" unless you pin them to something observable.
- Keep the whole document as short as it can be while remaining testable. No filler.

## Step 5: Tune the backlog to the builder model

Task size and detail depend on the tier. The earliest tasks must produce something runnable.

**Tier A (frontier API):** feature-sized tasks. One-line entries in section 7 are enough. Do not create docs/TASKS.md.

**Tier B-C (large/mid local):** tasks scoped to one file or module. Keep section 7 as the index and write a task card for each task in `docs/TASKS.md`.

**Tier D (small local):** atomic tasks, each one function or one file, aiming for under ~150 changed lines. Keep section 7 as the index and write a task card for each task in `docs/TASKS.md`. Also:
- Pin the stack in section 5: language, framework and tool versions, and "do not add dependencies".
- Keep each card self-contained so the model never needs the whole spec in context.
- Prefer exact paths, signatures and example input/output over prose.
- Give every task a runnable check or an explicit playtest step, so the model gets pass/fail feedback instead of judging itself.
- Avoid tasks that need reasoning across several files; split them or add an interface task first.

Task card format in docs/TASKS.md:

```
### T-001 <title>
- Requirements: R-001
- Files: path/to/file (create | edit)
- Context to load: SPEC section 5; R-001; path/to/file
- Interface: exact signature(s) or data shape
- Example: input -> expected output
- Done when: runnable command, or observable playtest step
- Status: todo | in-review | done
```

Cards must not contradict SPEC.md. The spec wins if they differ.

## Step 6: Add the CLAUDE.md pointer

If `CLAUDE.md` exists, append the line(s) below if not already there; otherwise create it with them.

Always:

```
Product spec: see docs/SPEC.md (requirement IDs R-xxx, tasks T-xxx). Reference IDs in commits and tests.
```

For tiers B-D only, also:

```
Task cards: docs/TASKS.md. Builder model and context limits are in SPEC section 5.
```

If the `task-review` skill is in the project, also add this to `CLAUDE.md` (any tier):

```
Task review: after committing a task, the developer may say "review T-xxx". Run the task-review skill as a read-only subagent on that commit (see "Reviewing tasks" in the spec-plus skill).
```

If a local agent tool is named (Aider, Cline), tell the user to load docs/SPEC.md and the current task card as read-only context, since that tool will not read CLAUDE.md.

## Step 7: Review pass

Before presenting, re-read the spec as a sceptical reviewer and check:
- Every Must requirement has at least one task and at least one testable acceptance criterion.
- No two requirements contradict each other.
- Out-of-scope items are not smuggled back in as requirements.
- Every assumption is listed in section 6.
- Section 5 has a Build/test commands line.
- The task order yields something runnable early.
- For tiers B-D: every task has a card, each card names its files and a check, and no card exceeds the tier's size limit.

Fix what you can. Then show the user a short summary:
1. The requirement list (ID, title, priority) — one line each.
2. **Gaps or contradictions found** (and what you did about them).
3. **Assumptions and open questions** that need their decision.

Ask the user to approve or request changes. On approval, set `Status: Approved` and add a change-log entry. If they request changes, edit the spec, bump the version (0.2, 0.3 ...), log the change, and re-run the review pass.

## After the spec is approved

Tell the user they can now say things like "build T-001" and you will work from `docs/SPEC.md` (and the task card, for tiers B-D). When building:
- Reference requirement and task IDs in commit messages and test names.
- Commit each task on its own, with its task ID in the commit message, so it can be reviewed as a single commit.
- Mark tasks `done` in the backlog (and the card) only after they are completed and verified. If the project uses the `task-review` skill, a committed task is `in-review` until the review returns PASS, then `done`.
- If implementation reveals the spec is wrong or incomplete, say so, propose the spec change, and log it rather than silently drifting from the spec.

## Reviewing tasks (optional)

If the `task-review` skill is in the project, the developer can ask for a review of a committed task, for example "review T-003". Run it as a read-only subagent on that task's commit so the next task can proceed meanwhile. Rules:

- Review only a committed task, and give the reviewer the commit, never "the latest changes".
- Keep **one review in flight** at a time. Do not start a second until the first returns.
- Only start the next task while a review is running if it does not depend on the task under review (no shared files or interfaces it changes). Otherwise wait for the verdict.
- On **PASS**, set the task to `done` (backlog and card).
- On **CHANGES-NEEDED**, set the task back to `todo`, fix the findings in a new commit that references the task ID, set it to `in-review`, and request a fresh review of the task's commits. Finish the fix before starting any other review.
- If a finding shows the spec itself is wrong, propose a spec change and log it, as in the section above.

## If a spec already exists

If `docs/SPEC.md` already exists, do not overwrite it. Ask whether the user wants to revise it (keep IDs, bump the version, log the change) or start a new spec elsewhere. When revising, re-ask the builder-model question if the user says the model has changed, then regenerate the task cards for the new tier and log the change.
