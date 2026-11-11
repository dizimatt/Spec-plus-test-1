// Shared constants. Phaser 3.80.1 is vendored in lib/ (R-001).
export const TILE = 64;
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;
export const COLORS = {
  bg: 0x14202b,
  cell: 0x22384a,
  cellEdge: 0x2f4d66,
  blocked: 0x0b1118,
  pipe: 0x9aa7b3,
  pipeEdge: 0x5d6b78,
  water: 0x2f9bff,
  source: 0x35c27a,
  drain: 0xe0a030,
  button: 0x3b5b78,
};
// Texture keys, generated once in BootScene (R-008).
export const TEX = {
  cell: 'cell',
  blocked: 'blocked',
  straight: 'pipe-straight',   // default orientation: horizontal (west-east)
  elbow: 'pipe-elbow',         // default orientation: opens north and east
  waterStraight: 'water-straight',
  waterElbow: 'water-elbow',
  source: 'source',
  drain: 'drain',
  button: 'button',
};
