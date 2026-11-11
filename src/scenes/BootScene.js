import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { generateTextures } from '../textures.js';
import { loadAllLevels, LEVEL_COUNT } from '../levels.js';
import { Progress, browserStorage } from '../logic/progress.js';

// Generates all textures (R-008) and loads the level files (R-002), then
// hands over to the menu. Bad level data shows a readable error instead of
// a blank screen.
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  async create() {
    generateTextures(this);
    const { levels, errors } = await loadAllLevels();
    this.registry.set('levels', levels);
    // Saved unlocks (R-007); falls back to level 1 only if storage is unusable.
    this.registry.set('progress', new Progress(browserStorage(), LEVEL_COUNT));
    if (errors.length) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
        ['Level data problem:', '', ...errors].join('\n'), {
          fontFamily: 'sans-serif', fontSize: '20px', color: '#ff8a8a',
          align: 'left', wordWrap: { width: GAME_WIDTH - 80 },
        }).setOrigin(0.5);
      return;
    }
    this.scene.start('Menu');
  }
}
