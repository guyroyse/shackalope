/* how much a solar-terrestrial reading matters to someone on HF: quiet,
   worth a look (warn), or disruptive (alert), with a word saying why.
   Thresholds follow NOAA's space weather scales where they have one */

export type Level = 'quiet' | 'warn' | 'alert'

export type Reading = {
  level: Level
  note: string | null
}

const QUIET: Reading = { level: 'quiet', note: null }

const XRAY_CLASS = /^([ABCMX])/i

const GEOMAGNETIC_LEVELS: Record<string, Level> = {
  Active: 'warn',
  'Minor storm': 'alert',
  'Major storm': 'alert',
  'Severe storm': 'alert'
}

/* K 4 is active, and K 5 is a G1 storm */
export function readKIndex(kIndex: number | null): Reading {
  if (kIndex === null) return QUIET
  if (kIndex >= 5) return { level: 'alert', note: 'storm' }
  if (kIndex >= 4) return { level: 'warn', note: 'active' }
  return QUIET
}

/* A 16 to 29 is active, and 30 or more is a storm */
export function readA_Index(aIndex: number | null): Reading {
  if (aIndex === null) return QUIET
  if (aIndex >= 30) return { level: 'alert', note: 'storm' }
  if (aIndex >= 16) return { level: 'warn', note: 'active' }
  return QUIET
}

/* a southward Bz couples the solar wind into the magnetosphere */
export function readBz(magneticField: number | null): Reading {
  if (magneticField === null) return QUIET
  if (magneticField <= -10) return { level: 'alert', note: 'south' }
  if (magneticField <= -5) return { level: 'warn', note: 'south' }
  return QUIET
}

/* a quiet solar wind runs 300 to 500 km/s */
export function readSolarWind(solarWind: number | null): Reading {
  if (solarWind === null) return QUIET
  if (solarWind >= 700) return { level: 'alert', note: 'fast' }
  if (solarWind >= 500) return { level: 'warn', note: 'fast' }
  return QUIET
}

/* M and X flares are the ones that black out HF on the daylit side */
export function readXray(xray: string | null): Reading {
  const flareClass = xray?.match(XRAY_CLASS)?.[1]?.toUpperCase()
  if (flareClass === 'X') return { level: 'alert', note: 'flare' }
  if (flareClass === 'M') return { level: 'warn', note: 'flare' }
  return QUIET
}

/* the label already says why, so no note */
export function readGeomagneticField(field: string | null): Reading {
  const level = field === null ? undefined : GEOMAGNETIC_LEVELS[field]
  return level ? { level, note: null } : QUIET
}
