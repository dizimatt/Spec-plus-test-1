import { generateTextures } from '../textures.js';

// Generates all textures, then hands over to the menu (R-008).
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    generateTextures(this);
    this.scene.start('Menu');
  }
}
