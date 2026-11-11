import { GAME_WIDTH, TEX } from '../config.js';
import { LEVEL_COUNT } from '../levels.js';

const TEXT = { fontFamily: 'sans-serif', color: '#ffffff' };
const TILE_SIZE = 120;
const GAP = 24;

// Level select (R-007, R-009): level 1 is open on first load, the rest unlock
// as the player wins. Locked levels are dimmed and cannot be started.
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const progress = this.registry.get('progress');
    this.add.text(GAME_WIDTH / 2, 120, 'Pipe Nightmare', { ...TEXT, fontSize: '56px' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 205, 'Select a level', { ...TEXT, fontSize: '26px', color: '#9fd0ff' }).setOrigin(0.5);

    const rowWidth = LEVEL_COUNT * TILE_SIZE + (LEVEL_COUNT - 1) * GAP;
    const x0 = GAME_WIDTH / 2 - rowWidth / 2 + TILE_SIZE / 2;
    for (let n = 1; n <= LEVEL_COUNT; n++) {
      const x = x0 + (n - 1) * (TILE_SIZE + GAP);
      const y = 340;
      const open = progress.isUnlocked(n);
      const tile = this.add.image(x, y, open ? TEX.levelTile : TEX.levelLocked);
      this.add.text(x, y - 10, String(n), {
        ...TEXT, fontSize: '48px', color: open ? '#ffffff' : '#4a5b6b',
      }).setOrigin(0.5);
      if (!open) {
        this.add.text(x, y + 30, 'Locked', { ...TEXT, fontSize: '16px', color: '#4a5b6b' }).setOrigin(0.5);
        continue;
      }
      // Best score for this level, saved in the browser (R-011).
      const best = progress.bestScore(n);
      this.add.text(x, y + 32, best === null ? 'No score' : `Best ${best}`, {
        ...TEXT, fontSize: '16px', color: best === null ? '#9fb4c8' : '#ffd76a',
      }).setOrigin(0.5);
      tile.setInteractive({ useHandCursor: true });
      tile.on('pointerover', () => tile.setTint(0xbbddff));
      tile.on('pointerout', () => tile.clearTint());
      tile.on('pointerdown', () => this.scene.start('Game', { level: n }));
    }
  }
}
