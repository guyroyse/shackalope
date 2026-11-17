export type Station = {
  callsign: string
  operatorName: string | null
  qth: string | null
  grid: string | null
}

export type StationUpdate = Partial<Record<keyof Station, string | null>>

export const DEFAULT_STATION: Station = {
  callsign: 'N0CALL',
  operatorName: null,
  qth: null,
  grid: null
}

const MAIDENHEAD_GRID = /^[A-R]{2}[0-9]{2}([A-X]{2}([0-9]{2})?)?$/i
const CALLSIGN = /^[A-Z0-9]+(\/[A-Z0-9]+)*$/i

/* null or an empty string clears a field; omitted fields are left alone */
export function applyStationUpdate(
  station: Station,
  update: StationUpdate
): Station {
  const updated = { ...station }

  if (update.callsign !== undefined)
    updated.callsign = normalizeCallsign(update.callsign)

  if (update.operatorName !== undefined)
    updated.operatorName = blankToNull(update.operatorName)

  if (update.qth !== undefined) updated.qth = blankToNull(update.qth)
  if (update.grid !== undefined) updated.grid = normalizeGrid(update.grid)

  return updated
}

function normalizeCallsign(callsign: string | null): string {
  const trimmed = blankToNull(callsign)
  if (trimmed === null) return DEFAULT_STATION.callsign

  if (!CALLSIGN.test(trimmed))
    throw new Error(`"${trimmed}" doesn't look like a callsign`)

  return trimmed.toUpperCase()
}

/* EN80ab: field uppercase, subsquare lowercase, as hams usually write it */
function normalizeGrid(grid: string | null): string | null {
  const trimmed = blankToNull(grid)
  if (trimmed === null) return null

  if (!MAIDENHEAD_GRID.test(trimmed))
    throw new Error(`"${trimmed}" isn't a Maidenhead grid locator`)

  return `${trimmed.slice(0, 4).toUpperCase()}${trimmed.slice(4).toLowerCase()}`
}

function blankToNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}
