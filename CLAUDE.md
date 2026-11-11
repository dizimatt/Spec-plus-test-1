Product spec: see docs/SPEC.md (requirement IDs R-xxx, tasks T-xxx). Reference IDs in commits and tests.
Task review: after committing a task, the developer may say "review T-xxx". Run the task-review skill as a read-only subagent on that commit (see "Reviewing tasks" in the spec-plus skill).

Project: Pipe Nightmare, a Phaser 3 pipe puzzle on plain static files (no build step). Phaser 3.80.1 is vendored in lib/.
Run: `python3 -m http.server 8000` then open http://localhost:8000/ (ES modules do not work from file://). Tests: `node --test` (Node 24 rejects `node --test tests/`).
Progress: T-001 done and reviewed (PASS); T-002 done (src/logic/*, tests/logic.test.js), awaiting review. Next: T-003 (level format, loader, 5 levels). Backlog and statuses live in docs/SPEC.md section 7.
Conventions: default straight pipe is horizontal; default elbow opens north and east; rotation is 90 degrees clockwise. All shapes are drawn once into textures in BootScene (src/textures.js), never per frame.
Open note: src/textures.js source/drain textures use hardcoded colours instead of COLORS (low priority cleanup).
