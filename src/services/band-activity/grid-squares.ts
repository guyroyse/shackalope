import { distanceKm } from './maidenhead'
import type { Coordinates } from './maidenhead'

const LETTER_A = 'A'.charCodeAt(0)

/* squares are 2° of longitude by 1° of latitude: 180 across, 180 down */
const SQUARES_ACROSS = 180
const SQUARES_DOWN = 180
const SQUARE_WIDTH = 2
const SQUARE_HEIGHT = 1

/* every 4-character square with any part inside the circle; the broker
   filters by square, so this is the rough cut, and distances from each
   receiver's own locator make the exact one */
export function squaresWithin(center: Coordinates, radiusKm: number): string[] {
  const squares: string[] = []

  for (let column = 0; column < SQUARES_ACROSS; column++) {
    for (let row = 0; row < SQUARES_DOWN; row++) {
      if (distanceKm(center, nearestPoint(center, column, row)) <= radiusKm)
        squares.push(squareName(column, row))
    }
  }

  return squares
}

/* the point in the square closest to the center; good enough for circles
   that don't reach a pole or the antimeridian */
function nearestPoint(
  center: Coordinates,
  column: number,
  row: number
): Coordinates {
  const west = column * SQUARE_WIDTH - 180
  const south = row * SQUARE_HEIGHT - 90

  return {
    latitude: clamp(center.latitude, south, south + SQUARE_HEIGHT),
    longitude: clamp(center.longitude, west, west + SQUARE_WIDTH)
  }
}

function squareName(column: number, row: number): string {
  const fieldLetters = [column, row]
    .map(index => String.fromCharCode(LETTER_A + Math.floor(index / 10)))
    .join('')

  return `${fieldLetters}${column % 10}${row % 10}`
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high)
}
