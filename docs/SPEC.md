# Pipe Nightmare — Specification

Status: Approved   Version: 0.2   Date: 2026-11-11

## 1. Summary
A real-time pipe-laying puzzle game built with Phaser, hosted as plain static files. Water starts flowing from a source on the left after a delay; the player places pipe pieces from a random queue and rotates tiles to build a connected route to the drain on the right before the water spills. Five hand-made levels, scored by how few tiles are used, with unlocked progress and best scores saved in the browser.

## 2. Users and core journey
Player: anyone with a desktop browser, playing alone (this is a personal project).

1. Player opens the page and sees the level select (level 1 open, the rest locked).
2. Player starts a level and sees the grid, a left-side source, a right-side drain, any blocked cells, and a queue of upcoming pipe pieces.
3. A countdown runs, then water begins to flow from the source.
4. Meanwhile the player clicks an empty cell to place the front piece of the queue, and clicks placed tiles to rotate them.
5. Water advances tile by tile along the pipe. A tile the water has entered is locked.
6. If water reaches the drain, the level is won and the next level unlocks. If it reaches a gap, a dead end, a blocked cell or the grid edge, it spills and the level is lost.
7. On a win, the player sees their score (fewer tiles used = higher score). Player retries, goes to the next level, or returns to the level select.

## 3. Requirements

### R-001 Static, no-build delivery
- Priority: Must
- Description: The game runs from plain files on any static web host, with no build step and no backend.
- Acceptance criteria:
  - [ ] Serving the repo root with a static file server (e.g. `python3 -m http.server`) and opening `index.html` starts the game with no console errors.
  - [ ] Phaser is loaded from a file in the repo, not from a CDN; no network requests are made to other hosts.
  - [ ] No `package.json` dependency or bundler is needed to run the game.
- Origin: Stated

### R-002 Grid and level data
- Priority: Must
- Description: Each level is a data file (JSON) defining grid width and height, source row, drain row, blocked cells, queue size, start delay and water speed. The source is on the left of the grid, the drain on the right.
- Acceptance criteria:
  - [ ] Exactly 5 level data files exist and each loads without error.
  - [ ] Changing a value in a level file (e.g. a blocked cell or water speed) changes the level in the game with no code change.
  - [ ] Blocked cells are drawn distinctly and cannot receive a pipe.
  - [ ] Loading a level with invalid data (missing field, out-of-range cell) shows a readable error message instead of a blank screen.
- Origin: Stated (5 levels, blocked cells); Assumption (JSON format, field list)

### R-003 Pipe queue
- Priority: Must
- Description: Pieces come from a queue of random pipe parts. Only straight and elbow pieces exist. The first piece is the one placed next.
- Acceptance criteria:
  - [ ] The next N pieces are visible in the queue, where N is set by the level (default 5).
  - [ ] Placing the front piece removes it, shifts the queue up, and adds a new random piece at the back, so the queue never runs out.
  - [ ] Both piece types (straight, elbow) appear in the queue over a normal level.
  - [ ] The queue accepts an injected random source, so tests can make it deterministic.
  - [ ] There is no skip or discard control.
- Origin: Stated (random queue, straight and elbow only); Assumption (visible count, no skip)

### R-004 Placing and rotating
- Priority: Must
- Description: The player places the front piece on any empty, non-blocked cell, and can rotate any placed tile that water has not entered. There is no per-placement timer.
- Acceptance criteria:
  - [ ] Clicking an empty cell places the front queue piece there, in its default orientation.
  - [ ] Clicking a placed, unlocked tile rotates it 90° clockwise. A straight piece alternates horizontal/vertical; an elbow cycles through 4 orientations.
  - [ ] Clicking a blocked cell, the source, the drain, or a locked tile does nothing.
  - [ ] A placed piece cannot be replaced or removed, only rotated.
  - [ ] There is no timer on placement; waiting any length of time does not discard or change the queue.
- Origin: Stated (place anywhere empty, rotate any tile, no placement timer); Assumption (click to rotate, clockwise, no replace)

### R-005 Water flow
- Priority: Must
- Description: After the level's start delay, water flows from the source into the grid at a steady rate, one tile at a time. A tile is locked from the moment water enters it.
- Acceptance criteria:
  - [ ] A visible countdown shows the time until the water starts.
  - [ ] Water fills each tile over a duration set by the level, visibly filling along the pipe path.
  - [ ] When water enters a tile, the tile can no longer be rotated.
  - [ ] Water enters the first grid cell from the source's side, and exits each tile through the opening opposite its entry, following the pipe shape.
  - [ ] Water speed is the same for the whole level (no speed-up within a level).
- Origin: Stated (rising water, locked once entered); Assumption (constant speed, countdown)

### R-006 Win and lose
- Priority: Must
- Description: Water reaching the drain wins the level; water spilling loses it.
- Acceptance criteria:
  - [ ] Water leaving a tile into the drain triggers a win screen.
  - [ ] Water meeting an empty cell, a blocked cell, the grid edge, or a tile with no opening facing it triggers a spill and a lose screen.
  - [ ] The win screen shows the level's score (see R-011).
  - [ ] Both outcomes offer Retry and Level select; a win also offers Next level (except on the last level).
  - [ ] Retry restores the level's starting state with a fresh random queue.
  - [ ] The player can keep placing and rotating unlocked tiles up until the moment of spill or win.
- Origin: Stated (water spilling loses, reaching the end wins)

### R-007 Levels and saved progress
- Priority: Must
- Description: Levels unlock in order. Progress is saved in `localStorage`.
- Acceptance criteria:
  - [ ] On first load only level 1 is selectable.
  - [ ] Winning level N unlocks level N+1.
  - [ ] After a page reload, the unlocked levels are still unlocked.
  - [ ] Any unlocked level can be replayed.
  - [ ] If `localStorage` is unavailable or holds invalid data, the game still runs with only level 1 unlocked and no crash.
  - [ ] The 5 levels get harder (smaller start delay, faster water, more blocked cells or a larger grid) and each can be completed with a valid route.
- Origin: Stated (5 hand-made levels, localStorage); Assumption (sequential unlock, difficulty levers)

### R-008 Textures generated at boot
- Priority: Must
- Description: All shape-drawn graphics (pipe pieces, water fill, grid cells, blocked cells, source, drain, UI buttons) are created once during a boot scene as textures, then used as sprites or images. No per-frame shape drawing in gameplay scenes.
- Acceptance criteria:
  - [ ] The boot scene generates the textures (e.g. via `generateTexture`) before the menu scene starts.
  - [ ] The game scenes' update/draw code contains no `Graphics` shape-drawing calls.
  - [ ] No image files are loaded; the game works with no image assets in the repo.
- Origin: Stated

### R-009 Menus and feedback
- Priority: Should
- Description: A level select screen, an in-level restart button and a readable HUD.
- Acceptance criteria:
  - [ ] The level select shows all 5 levels, with locked ones visibly distinct.
  - [ ] During a level, a button returns to level select and another restarts the level.
  - [ ] The queue, countdown/water status and level number are visible during play.
- Origin: Assumption

### R-010 Testable game logic
- Priority: Should
- Description: Grid, pieces, rotation, queue and water-step rules live in pure JavaScript modules with no Phaser dependency, covered by Node tests.
- Acceptance criteria:
  - [ ] `node --test tests/` runs and passes.
  - [ ] Tests cover: piece openings per rotation, queue refill, placement rules, rotation lock, a water path that wins, and a water path that spills (gap, dead end, blocked cell, edge).
  - [ ] Game scenes call the logic modules for rules instead of re-implementing them.
- Origin: Assumption

### R-011 Scoring
- Priority: Must
- Description: Winning a level gives a score that falls as more tiles are used. Best score per level is saved.
- Acceptance criteria:
  - [ ] Score is computed by a pure function of tiles placed: `score = max(0, 1000 - 50 * tilesPlaced)`, where `tilesPlaced` counts every piece placed in the attempt (rotations do not count).
  - [ ] Placing more pieces never increases the score; examples: 10 tiles -> 500, 20 tiles -> 0, 25 tiles -> 0.
  - [ ] The win screen shows the score and tiles used; the HUD shows the live tile count during play.
  - [ ] The best score per level is saved in `localStorage`, survives a reload, and is shown on the level select; a lower score on a replay does not overwrite it.
  - [ ] A lost level gives no score.
  - [ ] Invalid or missing saved scores are treated as no score, with no crash.
- Origin: Stated (more tiles used, lower score); Assumption (formula, counting rule, saving best)

## 4. Out of scope
- T-junctions, crosses and any branching water
- Pre-placed or fixed pipes (other than the source and drain)
- Level editor and endless mode
- Sound and music
- Online leaderboard, accounts, server-side saving or any backend
- Mobile-specific layout (touch is a bonus only if it works for free)
- Per-placement timers, skipping or discarding queue pieces

## 5. Constraints and technical notes
- Platform: desktop browser, mouse input. Hosted as static files.
- Stack: Phaser 3 (pin an exact version, vendored into the repo, e.g. `lib/phaser.min.js`), plain JavaScript ES modules, no bundler, no other dependencies. Files: `index.html`, `src/` (scenes, logic), `levels/` (JSON), `tests/`.
- Graphics are drawn in code and converted to textures at boot (R-008).
- Builder model: Claude Sonnet (tier A), context default, tool Claude Code.
- Build/test commands: none (no build step); `node --test tests/`. The game is also checked by playtest via `python3 -m http.server`.

## 6. Assumptions and open questions
- A-001 Phaser 3 is the version used — proposed default, needs confirmation
- A-002 Queue shows 5 pieces by default and has no skip — proposed default
- A-003 Click rotates 90° clockwise; placed pieces cannot be removed — proposed default
- A-004 Source and drain are fixed markers outside the grid edge, on rows set by the level — proposed default
- A-005 Levels unlock sequentially and the order is fixed — proposed default
- A-006 Levels are JSON files, one per level — proposed default
- A-007 Water speed is constant within a level; difficulty rises across levels — proposed default
- A-008 "Tiles used" means every piece placed during the attempt, including ones off the final route; score = max(0, 1000 - 50 x tiles placed); best score per level is stored in localStorage — proposed default, needs confirmation
- Q-001 (resolved) Name is "Pipe Nightmare".
- Q-002 (resolved) Scores are included, see R-011.

## 7. Task backlog
- T-001 Scaffold: `index.html`, vendored Phaser, boot scene generating all textures, empty menu scene — Requirements: R-001, R-008 — Status: in-review
- T-002 Pure logic modules (pieces, rotation, grid, queue, water step) with Node tests — Requirements: R-003, R-004, R-005, R-006, R-010 — Status: todo
- T-003 Level format, loader with validation, and 5 level files — Requirements: R-002, R-007 — Status: todo
- T-004 Game scene: grid, queue display, placing and rotating — Requirements: R-003, R-004, R-009 — Status: todo
- T-005 Water flow animation, tile locking, win and lose screens — Requirements: R-005, R-006 — Status: todo
- T-006 Level select, unlock progress in localStorage, error handling — Requirements: R-007, R-009 — Status: todo
- T-007 Scoring: score function with tests, tile counter, score on win screen, best scores saved and shown on level select — Requirements: R-011 — Status: todo
- T-008 Tune the 5 levels by playtest and confirm each is winnable — Requirements: R-002, R-007, R-011 — Status: todo

## 8. Change log
- 0.1 — Initial draft from /spec-plus interview.
- 0.2 — Approved. Renamed to Pipe Nightmare; added R-011 scoring (fewer tiles = higher score), A-008, T-007; tuning moved to T-008; resolved Q-001, Q-002.
