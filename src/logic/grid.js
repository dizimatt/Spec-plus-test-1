import { rotate } from './pieces.js';

// Grid state and placement/rotation rules (R-004, R-010).
// The source (left) and drain (right) sit outside the grid edge on the
// rows given by the level, so no click can target them (A-004).
export class Grid {
  constructor({ width, height, sourceRow, drainRow, blocked = [] }) {
    this.width = width;
    this.height = height;
    this.sourceRow = sourceRow;
    this.drainRow = drainRow;
    this.blocked = new Set(blocked.map(([x, y]) => `${x},${y}`));
    this.tiles = new Map(); // "x,y" -> { type, rotation, locked }
  }

  inBounds(x, y) {
    return Number.isInteger(x) && Number.isInteger(y) &&
      x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  // Every piece placed so far. Pieces can never be removed, so this is the
  // attempt's tile count for scoring (R-011); rotations do not change it.
  get tilesPlaced() { return this.tiles.size; }

  isBlocked(x, y) { return this.blocked.has(`${x},${y}`); }
  getTile(x, y) { return this.tiles.get(`${x},${y}`) || null; }

  // Places `type` in default orientation on an empty, non-blocked cell.
  place(x, y, type) {
    if (!this.inBounds(x, y)) return { ok: false, reason: 'out-of-bounds' };
    if (this.isBlocked(x, y)) return { ok: false, reason: 'blocked' };
    if (this.getTile(x, y)) return { ok: false, reason: 'occupied' };
    this.tiles.set(`${x},${y}`, { type, rotation: 0, locked: false });
    return { ok: true };
  }

  // Rotates a placed tile 90 degrees clockwise unless water has entered it.
  rotateTile(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return { ok: false, reason: 'empty' };
    if (tile.locked) return { ok: false, reason: 'locked' };
    tile.rotation = rotate(tile.type, tile.rotation);
    return { ok: true };
  }
}
