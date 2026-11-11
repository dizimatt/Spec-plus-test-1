import { GAME_WIDTH, GAME_HEIGHT, TILE, TEX, FAST_FORWARD } from '../config.js';
import { Grid } from '../logic/grid.js';
import { PieceQueue } from '../logic/queue.js';
import { Round } from '../logic/round.js';
import { computeScore } from '../logic/score.js';
import { LEVEL_COUNT } from '../levels.js';

const GRID_X = 96;   // left edge of grid; the source sits in the 64px before it
const GRID_Y = 100;
const QUEUE_X = 850;
const PIPE_TEX = { straight: TEX.straight, elbow: TEX.elbow };
const WATER_TEX = { straight: TEX.waterStraight, elbow: TEX.waterElbow };
const TEXT = { fontFamily: 'sans-serif', color: '#ffffff' };
const SPILL_TEXT = {
  gap: 'The water spilled out from the pipe.',
  'dead-end': 'The water hit a pipe with no opening.',
  blocked: 'The water was blocked.',
  edge: 'The water spilled out from the pipe.',
};

// Grid, queue, placing and rotating (R-003, R-004, R-009) plus water flow,
// locking and the win/lose screens (R-005, R-006). Rules and timing live in
// src/logic (Grid, PieceQueue, Round); this scene draws and forwards clicks.
// All shapes are pre-made textures, so there is no Graphics drawing here (R-008).
export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.levelNumber = data.level || 1; }

  create() {
    const level = this.registry.get('levels')?.[this.levelNumber - 1];
    // Locked or missing levels cannot be started (R-007).
    if (!level || !this.registry.get('progress').isUnlocked(this.levelNumber)) { this.scene.start('Menu'); return; }
    this.level = level;
    this.grid = new Grid(level);
    this.queue = new PieceQueue(level.queueSize);
    this.round = new Round(this.grid, level);
    // DEV CHEAT (kept on purpose, see README): P pauses/resumes the water clock at any
    // time, G starts the water now. Both work mid-level, so no reload is needed.
    this.cheatPaused = false;
    this.input.keyboard.on('keydown-P', () => { this.cheatPaused = !this.cheatPaused; });
    this.input.keyboard.on('keydown-G', () => { if (this.round.phase === 'countdown') this.round.countdown = 0; });
    this.tileImages = new Map();  // "x,y" -> pipe image
    this.cellImages = new Map();  // "x,y" -> cell image
    this.waterImages = [];        // one per entry in round.path
    this.endShown = false;

    this.add.text(24, 20, `Level ${this.levelNumber}`, { ...TEXT, fontSize: '32px' });
    this.add.text(400, 38, 'Pipe Nightmare', { ...TEXT, fontSize: '30px', fontStyle: 'bold' }).setOrigin(0.5);
    this.tilesText = this.add.text(400, 72, 'Tiles: 0', { ...TEXT, fontSize: '20px', color: '#9fd0ff' }).setOrigin(0.5);
    this.status = this.add.text(24, 62, '', { ...TEXT, fontSize: '20px', color: '#9fd0ff' });
    this.makeButton(GAME_WIDTH - 250, 38, 'Restart', () => this.scene.restart({ level: this.levelNumber }));
    this.makeButton(GAME_WIDTH - 110, 38, 'Levels', () => this.scene.start('Menu'));
    // Optional fast-forward so a finished route is not a boring wait (R-005).
    this.fast = false;
    const ff = this.makeButton(QUEUE_X, 560, `Speed x${FAST_FORWARD}`, () => {
      this.fast = !this.fast;
      this.round.timeScale = this.fast ? FAST_FORWARD : 1;
      ff.text.setText(this.fast ? 'Speed x1' : `Speed x${FAST_FORWARD}`).setColor(this.fast ? '#ffd76a' : '#ffffff');
    });

    this.buildGrid();
    this.buildQueue();
  }

  makeButton(x, y, label, onClick, depth = 0) {
    const img = this.add.image(x, y, TEX.button).setDisplaySize(120, 40)
      .setInteractive({ useHandCursor: true }).setDepth(depth);
    const text = this.add.text(x, y, label, { ...TEXT, fontSize: '20px' }).setOrigin(0.5).setDepth(depth);
    img.on('pointerover', () => img.setTint(0xbbddff));
    img.on('pointerout', () => img.clearTint());
    img.on('pointerdown', onClick);
    return { img, text };
  }

  cellCentre(x, y) {
    return { px: GRID_X + x * TILE + TILE / 2, py: GRID_Y + y * TILE + TILE / 2 };
  }

  buildGrid() {
    const { width, height, sourceRow, drainRow } = this.level;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const { px, py } = this.cellCentre(x, y);
        const blocked = this.grid.isBlocked(x, y);
        const cell = this.add.image(px, py, blocked ? TEX.blocked : TEX.cell);
        this.cellImages.set(`${x},${y}`, cell);
        if (blocked) continue;
        cell.setInteractive({ useHandCursor: true });
        cell.on('pointerover', () => cell.setTint(0xbbddff));
        cell.on('pointerout', () => cell.clearTint());
        cell.on('pointerdown', () => this.onCellClick(x, y));
      }
    }
    // Source and drain are markers outside the grid edge (A-004); not clickable.
    const src = this.cellCentre(-1, sourceRow);
    const drn = this.cellCentre(width, drainRow);
    this.add.image(src.px, src.py, TEX.source);
    this.add.image(drn.px, drn.py, TEX.drain);
  }

  // Placing and rotating stay allowed until the water spills or wins (R-006);
  // the Grid refuses to rotate tiles the water has already entered (R-005).
  onCellClick(x, y) {
    if (this.round.over) return;
    if (this.grid.getTile(x, y)) {
      if (this.grid.rotateTile(x, y).ok) this.syncTile(x, y);
      return;
    }
    const type = this.queue.peek();
    if (!this.grid.place(x, y, type).ok) return;
    this.queue.take();
    this.tilesText.setText(`Tiles: ${this.grid.tilesPlaced}`);
    const { px, py } = this.cellCentre(x, y);
    this.tileImages.set(`${x},${y}`, this.add.image(px, py, PIPE_TEX[type]).setDepth(1));
    this.syncTile(x, y);
    this.refreshQueue();
  }

  // Rotation r is r * 90 degrees clockwise, matching Phaser's positive angle.
  syncTile(x, y) {
    const tile = this.grid.getTile(x, y);
    this.tileImages.get(`${x},${y}`).setAngle(tile.rotation * 90);
  }

  buildQueue() {
    this.add.text(QUEUE_X, 90, 'NEXT', { ...TEXT, fontSize: '22px' }).setOrigin(0.5);
    this.queueImages = this.queue.items.map((_, i) => {
      const y = 150 + i * (TILE + 12);
      this.add.image(QUEUE_X, y, TEX.cell);
      return this.add.image(QUEUE_X, y, TEX.straight);
    });
    this.refreshQueue();
  }

  refreshQueue() {
    this.queue.items.forEach((type, i) => {
      this.queueImages[i].setTexture(PIPE_TEX[type]).setAlpha(i === 0 ? 1 : 0.55);
    });
  }

  update(time, delta) {
    if (!this.cheatPaused) this.round.update(delta / 1000); // DEV CHEAT: P pauses
    this.drawWater();
    this.updateStatus();
    if (this.round.over && !this.endShown) {
      this.endShown = true;
      if (this.round.phase === 'won') this.recordWin();
      this.markSpill();
      // Brief pause so the last of the water is seen before the dialog.
      this.time.delayedCall(700, () => this.showEnd());
    }
  }

  updateStatus() {
    const r = this.round;
    if (this.cheatPaused && !this.round.over) this.status.setText('PAUSED: P resume'); // DEV CHEAT
    else if (r.phase === 'countdown') this.status.setText(`Water starts in ${Math.ceil(r.countdown)}s${this.fast ? ` (x${FAST_FORWARD})` : ''}`);
    else if (r.phase === 'flowing') this.status.setText(`Water is flowing!${this.fast ? ` (x${FAST_FORWARD})` : ''}`);
    else this.status.setText(r.phase === 'won' ? 'Connected!' : 'Spilled!');
  }

  // One water image per tile entered, cropped from the side the water came in
  // through so it visibly fills along the pipe (R-005).
  drawWater() {
    const { path, progress, over } = this.round;
    path.forEach((step, i) => {
      let img = this.waterImages[i];
      const tile = this.grid.getTile(step.x, step.y);
      if (!img) {
        const { px, py } = this.cellCentre(step.x, step.y);
        img = this.add.image(px, py, WATER_TEX[tile.type]).setDepth(2).setAngle(tile.rotation * 90);
        this.waterImages[i] = img;
      }
      const p = (i < path.length - 1 || over) ? 1 : progress;
      const side = (step.entry - tile.rotation + 4) % 4; // entry side in the unrotated texture
      const len = Math.max(1, Math.round(TILE * Math.min(1, p)));
      if (side === 0) img.setCrop(0, 0, TILE, len);
      else if (side === 1) img.setCrop(TILE - len, 0, len, TILE);
      else if (side === 2) img.setCrop(0, TILE - len, TILE, len);
      else img.setCrop(0, 0, len, TILE);
    });
  }

  // A win unlocks the next level and saves the score if it is the best so far
  // (R-007, R-011). A lost level gives no score.
  recordWin() {
    const progress = this.registry.get('progress');
    progress.unlockNext(this.levelNumber);
    this.score = computeScore(this.grid.tilesPlaced);
    this.newBest = progress.recordScore(this.levelNumber, this.score);
    this.best = progress.bestScore(this.levelNumber);
  }

  markSpill() {
    const at = this.round.spillAt;
    const cell = at && this.cellImages.get(`${at.x},${at.y}`);
    if (cell) cell.setTint(0xff6a6a);
  }

  showEnd() {
    const won = this.round.phase === 'won';
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    // The interactive overlay swallows clicks meant for the grid underneath.
    this.add.image(cx, cy, TEX.overlay).setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setTint(0x000000).setAlpha(0.6).setDepth(10).setInteractive();
    this.add.image(cx, cy, TEX.panel).setDepth(11);
    this.add.text(cx, cy - 90, won ? 'Level complete!' : 'Spilled!', {
      ...TEXT, fontSize: '44px', color: won ? '#7dffb0' : '#ff8a8a',
    }).setOrigin(0.5).setDepth(12);
    if (!won) {
      this.add.text(cx, cy - 36, SPILL_TEXT[this.round.reason] || '', {
        ...TEXT, fontSize: '20px',
      }).setOrigin(0.5).setDepth(12);
    } else {
      this.add.text(cx, cy - 38, `Score: ${this.score}`, { ...TEXT, fontSize: '34px' })
        .setOrigin(0.5).setDepth(12);
      this.add.text(cx, cy, `Tiles used: ${this.grid.tilesPlaced}`, { ...TEXT, fontSize: '20px' })
        .setOrigin(0.5).setDepth(12);
      this.add.text(cx, cy + 28, this.newBest ? 'New best!' : `Best: ${this.best}`, {
        ...TEXT, fontSize: '18px', color: this.newBest ? '#ffd76a' : '#9fd0ff',
      }).setOrigin(0.5).setDepth(12);
    }
    const buttons = [['Retry', () => this.scene.restart({ level: this.levelNumber })]];
    if (won && this.levelNumber < LEVEL_COUNT) {
      buttons.push(['Next level', () => this.scene.start('Game', { level: this.levelNumber + 1 })]);
    }
    buttons.push(['Level select', () => this.scene.start('Menu')]);
    const gap = 140;
    buttons.forEach(([label, fn], i) => {
      const x = cx + (i - (buttons.length - 1) / 2) * gap;
      this.makeButton(x, cy + 80, label, fn, 12);
    });
  }
}
