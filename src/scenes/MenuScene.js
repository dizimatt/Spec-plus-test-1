import { GAME_WIDTH, TEX, TILE } from '../config.js';

// Placeholder menu (level select arrives in T-006). Shows the generated
// textures as sprites to prove the boot step worked.
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    this.add.text(GAME_WIDTH / 2, 120, 'Pipe Nightmare', {
      fontFamily: 'sans-serif', fontSize: '56px', color: '#ffffff',
    }).setOrigin(0.5);

    const keys = [TEX.source, TEX.straight, TEX.elbow, TEX.waterStraight,
      TEX.waterElbow, TEX.cell, TEX.blocked, TEX.drain];
    const x0 = GAME_WIDTH / 2 - (keys.length * TILE) / 2 + TILE / 2;
    keys.forEach((key, i) => {
      const x = x0 + i * TILE;
      this.add.image(x, 280, TEX.cell);
      this.add.image(x, 280, key);
    });
  }
}
