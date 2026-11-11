import { GAME_WIDTH, TILE, TEX } from '../config.js';
import { Grid } from '../logic/grid.js';
import { PieceQueue } from '../logic/queue.js';

const GRID_X = 96;   // left edge of grid; the source sits in the 64px before it
const GRID_Y = 100;
const QUEUE_X = 850;
const PIPE_TEX = { straight: TEX.straight, elbow: TEX.elbow };
const TEXT = { fontFamily: 'sans-serif', color: '#ffffff' };

// Grid, queue display, placing and rotating (R-003, R-004, R-009).
// Rules come from src/logic; this scene only draws and forwards clicks.
// All shapes are pre-made textures, so there is no Graphics drawing here (R-008).
export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.levelNumber = data.level || 1; }

  create() {
    const level = this.registry.get('levels')?.[this.levelNumber - 1];
    if (!level) { this.scene.start('Menu'); return; }
    this.level = level;
    this.grid = new Grid(level);
    this.queue = new PieceQueue(level.queueSize);
    this.tileImages = new Map(); // "x,y" -> pipe image

    this.add.text(24, 20, `Level ${this.levelNumber}`, { ...TEXT, fontSize: '32px' });
    this.makeButton(GAME_WIDTH - 250, 38, 'Restart', () => this.scene.restart({ level: this.levelNumber }));
    this.makeButton(GAME_WIDTH - 110, 38, 'Levels', () => this.scene.start('Menu'));

    this.buildGrid();
    this.buildQueue();
  }

  makeButton(x, y, label, onClick) {
    const img = this.add.image(x, y, TEX.button).setDisplaySize(120, 40).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { ...TEXT, fontSize: '20px' }).setOrigin(0.5);
    img.on('pointerover', () => img.setTint(0xbbddff));
    img.on('pointerout', () => img.clearTint());
    img.on('pointerdown', onClick);
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

  onCellClick(x, y) {
    if (this.grid.getTile(x, y)) {
      if (this.grid.rotateTile(x, y).ok) this.syncTile(x, y);
      return;
    }
    const type = this.queue.peek();
    if (!this.grid.place(x, y, type).ok) return;
    this.queue.take();
    const { px, py } = this.cellCentre(x, y);
    this.tileImages.set(`${x},${y}`, this.add.image(px, py, PIPE_TEX[type]));
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
}
