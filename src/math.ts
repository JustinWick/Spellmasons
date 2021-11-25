import { CELL_SIZE } from './config';
import type { Coords } from './commonTypes';
// https://webdva.github.io/how-i-implemented-client-side-linear-interpolation/
export function lerp(start: number, end: number, time: number) {
  if (time >= 1) {
    return end;
  }
  if (time <= 0) {
    return start;
  }
  return start * (1 - time) + end * time;
}

// The distance between two cells if you allow diagonal movement
export function cellDistance(cell1: Coords, cell2: Coords) {
  return Math.max(Math.abs(cell2.x - cell1.x), Math.abs(cell2.y - cell1.y));
}
export function distance(coords1: Coords, coords2: Coords) {
  return Math.sqrt(
    Math.pow(coords2.x - coords1.x, 2) + Math.pow(coords2.y - coords1.y, 2),
  );
}

// Converts a singular index into x,y coords on a rectangle with a known width
export function indexToXY(index: number, width: number): Coords {
  return { x: index % width, y: Math.floor(index / width) };
}
export function xyToIndex(coords: Coords, width: number) {
  return coords.y * width + coords.x;
}

// Normalizes degrees within [0,Math.PI*2)
// for example Math.PI*2 turns into 0
// Math.PI*3 turns into Math.PI
// -Math.PI turns into Math.PI
export function normalizeRadians(degrees: number) {
  const remainder = degrees % (Math.PI * 2);
  if (remainder < 0) {
    return Math.PI * 2 + remainder;
  } else {
    return remainder;
  }
}

interface objectWithProbability {
  probability: number;
}
export function _chooseObjectWithProbability<T extends objectWithProbability>(roll: number, source: T[]): T {
  let rollingLowerBound = 0;
  // Iterate each object and check if the roll is between the lower bound and the upper bound
  // which means that the current object would have been rolled
  for (let x of source) {
    if (
      roll > rollingLowerBound &&
      roll <= x.probability + rollingLowerBound
    ) {
      return x;
    } else {
      rollingLowerBound += x.probability;
    }
  }
  // Logically it should never reach this point
  return source[0];

}
export function chooseObjectWithProbability<T extends objectWithProbability>(
  source: T[],
): T {
  // Chooses a random object in the source list based on its probability
  const maxProbability = source.reduce(
    (maxProbability, current) => current.probability + maxProbability,
    0,
  );
  // Choose random integer within the sum of all the probabilities
  const roll = window.underworld.random.integer(1, maxProbability);
  return _chooseObjectWithProbability(roll, source);
}
// convert from cell coordinates to objective board coordinates
export function cellToBoardCoords(cellX: number, cellY: number) {
  return {
    x: cellX * CELL_SIZE + CELL_SIZE / 2,
    y: cellY * CELL_SIZE + CELL_SIZE / 2,
  };
}

// Returns a point one step from start in the direction away from
// awayFrom
export function oneCellAwayFromCell(start: Coords, awayFrom: Coords): Coords {
  const dx = start.x - awayFrom.x;
  const dy = start.y - awayFrom.y;
  const normalizedX = dx === 0 ? 0 : dx / Math.abs(dx);
  const normalizedY = dy === 0 ? 0 : dy / Math.abs(dy);
  return { x: start.x + normalizedX, y: start.y + normalizedY };
}
