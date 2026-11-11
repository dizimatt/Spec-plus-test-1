import { startFlow, advance } from './water.js';

// One attempt at a level: countdown, then water filling tile after tile
// (R-005, R-006, R-010). Pure and time-driven by update(dtSeconds), so the
// scene only has to call update() and draw the state.
//
// phase: 'countdown' | 'flowing' | 'won' | 'lost'
// path:  tiles the water has entered, in order; every entry but the last is
//        full, and the last is full to `progress` (0..1) while flowing.
export class Round {
  constructor(grid, { startDelay, waterSpeed }) {
    this.grid = grid;
    this.waterSpeed = waterSpeed; // tiles per second, constant (A-007)
    this.timeScale = 1;           // 1 normally; the player's fast-forward raises it
    this.countdown = startDelay;  // seconds until water starts
    this.phase = 'countdown';
    this.path = [];
    this.progress = 0;
    this.reason = null;           // spill reason when lost
    this.spillAt = null;          // { x, y } of the cell water spilled into
  }

  get over() { return this.phase === 'won' || this.phase === 'lost'; }

  update(dt) {
    if (this.over) return;
    dt *= this.timeScale;
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown > 0) return;
      dt = -this.countdown; // time left over after the countdown ended
      this.countdown = 0;
      this._handle(startFlow(this.grid));
      if (this.over) return;
    }
    this.progress += dt * this.waterSpeed;
    while (this.progress >= 1 && this.phase === 'flowing') {
      this.progress -= 1;
      this._handle(advance(this.grid, this.path[this.path.length - 1]));
    }
  }

  _handle(flow) {
    if (flow.status === 'flowing') {
      this.phase = 'flowing';
      this.path.push(flow);
      return;
    }
    this.progress = 1;
    if (flow.status === 'won') {
      this.phase = 'won';
    } else {
      this.phase = 'lost';
      this.reason = flow.reason;
      this.spillAt = { x: flow.x, y: flow.y };
    }
  }
}
