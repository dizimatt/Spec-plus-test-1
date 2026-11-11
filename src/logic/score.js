// Scoring (R-011, R-010). Pure.
export const MAX_SCORE = 1000;
export const PENALTY_PER_TILE = 50;

// score = max(0, 1000 - 50 * tilesPlaced), where tilesPlaced counts every piece
// placed in the attempt (rotations do not count). More pieces never raise it.
export function computeScore(tilesPlaced) {
  if (typeof tilesPlaced !== 'number' || !Number.isFinite(tilesPlaced)) return 0;
  return Math.max(0, MAX_SCORE - PENALTY_PER_TILE * Math.max(0, tilesPlaced));
}
