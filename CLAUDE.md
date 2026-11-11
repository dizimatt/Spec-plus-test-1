Product spec: see docs/SPEC.md (requirement IDs R-xxx, tasks T-xxx). Reference IDs in commits and tests.
Task review: after committing a task, the developer may say "review T-xxx". Run the task-review skill as a read-only subagent on that commit (see "Reviewing tasks" in the spec-plus skill).

Project: Pipe Nightmare, a Phaser 3 pipe puzzle on plain static files (no build step). Phaser 3.80.1 is vendored in lib/.
Run: `python3 -m http.server 8000` then open http://localhost:8000/ (ES modules do not work from file://). Tests: `node --test` (Node 24 rejects `node --test tests/`).
Progress: T-001 done and reviewed (PASS); T-002 done and reviewed (PASS; src/logic/*, tests/logic.test.js). T-003 done and reviewed (PASS; levels/*.json, src/logic/level.js validation, src/levels.js loader; BootScene loads levels into registry key 'levels' and shows errors). T-004 done and reviewed (PASS; src/scenes/GameScene.js; Menu has a temporary "Play level 1" button). Next: T-005 (water flow, win/lose). Level fields: width, height, sourceRow, drainRow, blocked [[x,y]], queueSize, startDelay (s), waterSpeed (tiles/s). Backlog and statuses live in docs/SPEC.md section 7.
Conventions: default straight pipe is horizontal; default elbow opens north and east; rotation is 90 degrees clockwise. All shapes are drawn once into textures in BootScene (src/textures.js), never per frame.
Open note: src/textures.js source/drain textures use hardcoded colours instead of COLORS (low priority cleanup).
