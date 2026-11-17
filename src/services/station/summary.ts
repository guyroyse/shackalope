import type { Station } from './model'

export function describeStation({
  callsign,
  operatorName,
  qth,
  grid
}: Station): string {
  const details = [operatorName, qth, grid && `grid ${grid}`]
    .filter(Boolean)
    .join(', ')

  return details ? `Station ${callsign}: ${details}` : `Station ${callsign}`
}
