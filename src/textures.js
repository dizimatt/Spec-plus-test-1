import { TILE, COLORS, TEX } from './config.js';

// Draws every shape once and stores it as a texture (R-008).
// Called only from BootScene; gameplay scenes use the resulting images.
export function generateTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const T = TILE, C = T / 2, W = 18; // W = pipe thickness

  const make = (key, w, h, draw) => {
    g.clear();
    draw(g);
    g.generateTexture(key, w, h);
  };

  make(TEX.cell, T, T, (g) => {
    g.fillStyle(COLORS.cell).fillRect(0, 0, T, T);
    g.lineStyle(2, COLORS.cellEdge).strokeRect(1, 1, T - 2, T - 2);
  });

  make(TEX.blocked, T, T, (g) => {
    g.fillStyle(COLORS.blocked).fillRect(0, 0, T, T);
    g.lineStyle(4, 0x3a1f1f);
    g.lineBetween(10, 10, T - 10, T - 10);
    g.lineBetween(T - 10, 10, 10, T - 10);
  });

  // Pipe bodies: transparent background so they sit on top of a cell.
  const straight = (color, edge) => (g) => {
    g.fillStyle(edge).fillRect(0, C - W / 2 - 3, T, W + 6);
    g.fillStyle(color).fillRect(0, C - W / 2, T, W);
  };
  const elbow = (color, edge) => (g) => {
    // north arm + east arm meeting at the centre
    g.fillStyle(edge);
    g.fillRect(C - W / 2 - 3, 0, W + 6, C + W / 2 + 3);
    g.fillRect(C - W / 2 - 3, C - W / 2 - 3, C + W / 2 + 3, W + 6);
    g.fillStyle(color);
    g.fillRect(C - W / 2, 0, W, C + W / 2);
    g.fillRect(C - W / 2, C - W / 2, C + W / 2, W);
  };

  make(TEX.straight, T, T, straight(COLORS.pipe, COLORS.pipeEdge));
  make(TEX.elbow, T, T, elbow(COLORS.pipe, COLORS.pipeEdge));
  make(TEX.waterStraight, T, T, straight(COLORS.water, COLORS.water));
  make(TEX.waterElbow, T, T, elbow(COLORS.water, COLORS.water));

  make(TEX.source, T, T, (g) => {
    g.fillStyle(COLORS.source).fillRect(0, C - W / 2 - 3, T, W + 6);
    g.fillStyle(COLORS.source).fillCircle(C - 8, C, 20);
    g.fillStyle(0xffffff).fillTriangle(C, C - 10, C, C + 10, C + 16, C);
  });

  make(TEX.drain, T, T, (g) => {
    g.fillStyle(COLORS.drain).fillRect(0, C - W / 2 - 3, T, W + 6);
    g.fillStyle(COLORS.drain).fillCircle(C + 8, C, 20);
    g.fillStyle(0x14202b).fillCircle(C + 8, C, 9);
  });

  make(TEX.button, 200, 48, (g) => {
    g.fillStyle(COLORS.button).fillRoundedRect(0, 0, 200, 48, 8);
  });

  make(TEX.overlay, 4, 4, (g) => {
    g.fillStyle(0xffffff).fillRect(0, 0, 4, 4);
  });

  make(TEX.panel, 440, 300, (g) => {
    g.fillStyle(COLORS.bg).fillRoundedRect(0, 0, 440, 300, 16);
    g.lineStyle(3, COLORS.cellEdge).strokeRoundedRect(1.5, 1.5, 437, 297, 16);
  });

  g.destroy();
}
