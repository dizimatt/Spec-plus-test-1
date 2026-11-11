// Level data validation (R-002, R-010). Pure, no Phaser or fetch.
//
// Level file fields (all integers unless noted):
//   width, height   grid size in cells
//   sourceRow       row of the source, left of column 0
//   drainRow        row of the drain, right of the last column
//   blocked         list of [x, y] cells that cannot hold a pipe
//   queueSize       visible queue length (optional, default 5)
//   startDelay      seconds before water starts (number > 0)
//   waterSpeed      tiles filled per second (number > 0), constant per level
export const DEFAULT_QUEUE_SIZE = 5;
export const MAX_GRID = { width: 10, height: 8 };

export class LevelError extends Error {
  constructor(message, errors = [message]) {
    super(message);
    this.name = 'LevelError';
    this.errors = errors;
  }
}

const isInt = (v) => Number.isInteger(v);
const isPos = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

// Returns a list of readable problems; empty means the data is valid.
export function validateLevel(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return ['level data must be an object'];
  }
  const errors = [];
  const need = (key, ok, hint) => {
    if (data[key] === undefined) errors.push(`missing field "${key}"`);
    else if (!ok(data[key])) errors.push(`"${key}" ${hint}`);
    return data[key] !== undefined && ok(data[key]);
  };

  const wOk = need('width', (v) => isInt(v) && v >= 2 && v <= MAX_GRID.width, `must be an integer from 2 to ${MAX_GRID.width}`);
  const hOk = need('height', (v) => isInt(v) && v >= 1 && v <= MAX_GRID.height, `must be an integer from 1 to ${MAX_GRID.height}`);
  const rowOk = (v) => isInt(v) && hOk && v >= 0 && v < data.height;
  const rowHint = 'must be an integer row inside the grid';
  const srcOk = need('sourceRow', hOk ? rowOk : isInt, rowHint);
  const drnOk = need('drainRow', hOk ? rowOk : isInt, rowHint);
  need('startDelay', isPos, 'must be a number greater than 0');
  need('waterSpeed', isPos, 'must be a number greater than 0');
  if (data.queueSize !== undefined && !(isInt(data.queueSize) && data.queueSize >= 1 && data.queueSize <= 10)) {
    errors.push('"queueSize" must be an integer from 1 to 10');
  }

  if (data.blocked === undefined) {
    errors.push('missing field "blocked"');
  } else if (!Array.isArray(data.blocked)) {
    errors.push('"blocked" must be a list of [x, y] cells');
  } else {
    const seen = new Set();
    data.blocked.forEach((c, i) => {
      if (!Array.isArray(c) || c.length !== 2 || !isInt(c[0]) || !isInt(c[1])) {
        errors.push(`blocked cell #${i + 1} must be [x, y] with whole numbers`);
        return;
      }
      const [x, y] = c;
      if (wOk && hOk && (x < 0 || x >= data.width || y < 0 || y >= data.height)) {
        errors.push(`blocked cell [${x}, ${y}] is outside the ${data.width}x${data.height} grid`);
      } else if (seen.has(`${x},${y}`)) {
        errors.push(`blocked cell [${x}, ${y}] is listed twice`);
      }
      seen.add(`${x},${y}`);
      if (wOk && srcOk && x === 0 && y === data.sourceRow) errors.push(`blocked cell [${x}, ${y}] covers the source entry`);
      if (wOk && drnOk && x === data.width - 1 && y === data.drainRow) errors.push(`blocked cell [${x}, ${y}] covers the drain entry`);
    });
  }
  return errors;
}

// Validates and returns a normalised copy (defaults filled in), or throws a
// LevelError whose message names the level and lists every problem.
export function parseLevel(data, label = 'level') {
  const errors = validateLevel(data);
  if (errors.length) {
    throw new LevelError(`Invalid ${label}: ${errors.join('; ')}`, errors);
  }
  return {
    width: data.width,
    height: data.height,
    sourceRow: data.sourceRow,
    drainRow: data.drainRow,
    blocked: data.blocked.map(([x, y]) => [x, y]),
    queueSize: data.queueSize ?? DEFAULT_QUEUE_SIZE,
    startDelay: data.startDelay,
    waterSpeed: data.waterSpeed,
  };
}
