import { PIECE_TYPES } from './pieces.js';

// Queue of upcoming pieces (R-003). `rand` is injectable for tests and
// returns a number in [0, 1), like Math.random. No skip or discard.
export class PieceQueue {
  constructor(size = 5, rand = Math.random) {
    if (!Number.isInteger(size) || size < 1) throw new Error('Queue size must be a positive integer');
    this.size = size;
    this.rand = rand;
    this.items = [];
    while (this.items.length < size) this.items.push(this._next());
  }

  _next() {
    return PIECE_TYPES[Math.floor(this.rand() * PIECE_TYPES.length)];
  }

  peek() { return this.items[0]; }

  // Removes and returns the front piece, appending a new one at the back.
  take() {
    const front = this.items.shift();
    this.items.push(this._next());
    return front;
  }
}
