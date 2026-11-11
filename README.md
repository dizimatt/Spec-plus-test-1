# Pipe Nightmare

A real-time pipe-laying puzzle for the browser. Water starts flowing from the source on the left after a countdown. Place pipe pieces from a random queue and rotate them to build a connected route to the drain on the right before the water spills. Five hand-made levels, scored by how few tiles you use. Unlocked levels and best scores are saved in your browser.

Built with Phaser 3.80.1 (vendored in `lib/`), plain JavaScript ES modules, no build step and no dependencies. The full specification is in [`docs/SPEC.md`](docs/SPEC.md).

## Running it

Serve the folder with any static web server, then open it in a browser:

```
python3 -m http.server 8000
```

then open <http://localhost:8000/>. (`npx serve` or any other static server works too.)

Opening `index.html` straight from disk (`file://`) works in some browsers, such as VS Code's built-in one, but Chrome blocks ES modules and `fetch` on `file://`, so you get a blank page there. If a change doesn't show up, do a hard refresh (Ctrl+Shift+R); browsers cache the JS modules.

## Tests

```
node --test
```

Runs the logic and level tests (pieces, queue, grid, water, round timing, levels, progress, score). Node 24 rejects `node --test tests/`, so use the plain command. The game itself does not need Node.

## How to play

- Click an empty cell to place the front piece of the queue (right-hand side).
- Click a placed tile to rotate it 90° clockwise. Once water has entered a tile it is locked.
- Connect the green source to the orange drain before the water spills.
- **Speed x3** (bottom right) fast-forwards the countdown and the water, so a finished route is not a boring wait. Click again for normal speed. It does not change your score.
- Score = `max(0, 1000 - 50 × tiles placed)`. Every piece you place counts, rotations do not. Your best score per level is saved.

## Dev cheats

These are kept on purpose for testing. They are always on, so they are available to anyone playing the page. Click the game canvas first so it receives key presses.

| Key | Effect |
|---|---|
| **P** | Pause / resume the water clock (countdown and flow) at any time. You can still place and rotate while paused. The status line reads "PAUSED: P resume, G go". |
| **G** | Skip the rest of the countdown and start the water now. |

Handy browser-console snippets (DevTools, then Console; Chrome asks you to type `allow pasting` first). They only touch this page's local storage:

```js
// Unlock all five levels and keep saved scores
const k = 'pipe-nightmare-progress';
const d = JSON.parse(localStorage.getItem(k) || '{}');
localStorage.setItem(k, JSON.stringify({ ...d, unlocked: 5 }));

// Reset all progress and scores
localStorage.removeItem('pipe-nightmare-progress');
```

Saved data is a single JSON entry, `pipe-nightmare-progress`, shaped like `{"unlocked": 2, "best": {"1": 650}}`.

## Levels

Each level is a JSON file in `levels/` (`level1.json` to `level5.json`). Change a value and reload to change the level, with no code change.

| Field | Meaning |
|---|---|
| `width`, `height` | Grid size in cells (max 10 × 8) |
| `sourceRow`, `drainRow` | Row of the source (left of column 0) and drain (right of the last column) |
| `blocked` | List of `[x, y]` cells that cannot hold a pipe |
| `queueSize` | Visible queue length (optional, default 5) |
| `startDelay` | Seconds before the water starts |
| `waterSpeed` | Tiles filled per second, constant within a level |

Invalid level data shows a readable error on screen instead of a blank page.

## Project layout

```
index.html          page shell; loads Phaser then src/main.js
lib/                vendored Phaser 3.80.1
levels/             the five level files
src/logic/          pure game rules, no Phaser (pieces, queue, grid, water, round, level, progress, score)
src/scenes/         Phaser scenes (Boot, Menu = level select, Game)
src/textures.js     every shape is drawn once into a texture at boot
tests/              Node tests for src/logic and the level loader
docs/SPEC.md        requirements (R-xxx), task backlog (T-xxx), change log
CLAUDE.md           working notes for the AI developer
```

## Putting it on a website

It is plain static files, so it can be hosted anywhere that serves static content, including a WordPress site. Upload `index.html`, `src/`, `lib/` and `levels/` (not `docs/`, `tests/`) to a folder on your host, for example `yoursite.com/pipe-nightmare/`, using FTP or your host's file manager, since the WordPress Media Library usually refuses `.js` and `.json` files. Link to it, or embed it with an iframe sized 960 × 640. Remember the dev cheat keys above ship with it.
