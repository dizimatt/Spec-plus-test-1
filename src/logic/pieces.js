// Pure piece rules (R-004, R-010). No Phaser dependency.
// Directions are numbered clockwise from north.
export const N = 0, E = 1, S = 2, W = 3;
export const STRAIGHT = 'straight';
export const ELBOW = 'elbow';
export const PIECE_TYPES = [STRAIGHT, ELBOW];

export const opposite = (dir) => (dir + 2) % 4;

// Grid step for each direction (y grows downward).
export const DELTA = [
  { dx: 0, dy: -1 }, // N
  { dx: 1, dy: 0 },  // E
  { dx: 0, dy: 1 },  // S
  { dx: -1, dy: 0 }, // W
];

// Number of distinct orientations: straight alternates, elbow cycles 4.
export const rotationCount = (type) => (type === STRAIGHT ? 2 : 4);

// Default straight is horizontal (W-E); default elbow opens north and east.
// Rotation r turns the piece r * 90 degrees clockwise.
export function openings(type, rotation = 0) {
  if (type === STRAIGHT) {
    return rotation % 2 === 0 ? [E, W] : [N, S];
  }
  if (type === ELBOW) {
    return [N, E].map((d) => (d + rotation) % 4);
  }
  throw new Error(`Unknown piece type: ${type}`);
}

export const rotate = (type, rotation) => (rotation + 1) % rotationCount(type);

// If water enters through `entry`, returns the side it leaves by, or null
// when the piece has no opening on that side.
export function exitFor(type, rotation, entry) {
  const [a, b] = openings(type, rotation);
  if (entry === a) return b;
  if (entry === b) return a;
  return null;
}
