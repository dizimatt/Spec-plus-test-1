import { DELTA, W, opposite, exitFor } from './pieces.js';

// Water-step rules (R-005, R-006, R-010). Timing lives in the scene; this
// module only decides which tile water enters next and what happens there.
//
// flow = { status: 'flowing' | 'won' | 'spilled', x, y, entry, reason }
//   x, y   tile the water is currently in (flowing only)
//   entry  side of that tile the water came in through
//   reason why it spilled: 'gap' | 'dead-end' | 'blocked' | 'edge'

// Water enters cell (x, y) through side `entry`.
function enter(grid, x, y, entry) {
  if (x === grid.width && y === grid.drainRow && entry === W) {
    return { status: 'won', x, y, entry };
  }
  if (!grid.inBounds(x, y)) return { status: 'spilled', reason: 'edge', x, y, entry };
  if (grid.isBlocked(x, y)) return { status: 'spilled', reason: 'blocked', x, y, entry };
  const tile = grid.getTile(x, y);
  if (!tile) return { status: 'spilled', reason: 'gap', x, y, entry };
  if (exitFor(tile.type, tile.rotation, entry) === null) {
    return { status: 'spilled', reason: 'dead-end', x, y, entry };
  }
  tile.locked = true; // locked from the moment water enters
  return { status: 'flowing', x, y, entry };
}

// Water leaves the source and enters the first cell from the west.
export function startFlow(grid) {
  return enter(grid, 0, grid.sourceRow, W);
}

// The current tile is full: water leaves it and enters the next cell.
export function advance(grid, flow) {
  if (flow.status !== 'flowing') return flow;
  const tile = grid.getTile(flow.x, flow.y);
  const out = exitFor(tile.type, tile.rotation, flow.entry);
  const { dx, dy } = DELTA[out];
  return enter(grid, flow.x + dx, flow.y + dy, opposite(out));
}
