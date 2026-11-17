import { XMLParser } from 'fast-xml-parser'

import type {
  BandConditions,
  BandRating,
  HF_BandCondition,
  VHF_Condition
} from './model'

type RawElement = {
  name?: string
  time?: string
  location?: string
  text?: string
}

type SolarData = Record<string, unknown>

const HAMQSL_URL = 'https://www.hamqsl.com/solarxml.php'
const SOURCE = 'N0NBH via HamQSL (hamqsl.com)'

/* N0NBH updates roughly hourly; caching keeps us polite to a
   volunteer-run site */
const CACHE_TTL_MS = 15 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000

const HAMQSL_TIMESTAMP = /(\d{1,2}) (\w{3}) (\d{4}) (\d{2})(\d{2}) GMT/
const UNDERSCORES = /_/g

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

const RATINGS: BandRating[] = ['Good', 'Fair', 'Poor']

const GEOMAGNETIC_LABELS: Record<string, string> = {
  'VR QUIET': 'Very quiet',
  QUIET: 'Quiet',
  UNSETTLD: 'Unsettled',
  ACTIVE: 'Active',
  'MIN STORM': 'Minor storm',
  'MAJ STORM': 'Major storm',
  'SEV STORM': 'Severe storm'
}

const PHENOMENON_LABELS: Record<string, string> = {
  'vhf-aurora': 'Aurora',
  'E-Skip': 'E-skip'
}

const LOCATION_LABELS: Record<string, string> = {
  northern_hemi: 'Northern hemisphere',
  north_america: 'North America',
  europe: 'Europe',
  europe_6m: 'Europe, 6m',
  europe_4m: 'Europe, 4m'
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: 'text',
  parseTagValue: false,
  trimValues: true,
  isArray: name => name === 'band' || name === 'phenomenon'
})

let cache: { conditions: BandConditions; fetchedAt: number } | null = null

export async function fetchBandConditions(): Promise<BandConditions> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS)
    return cache.conditions

  const response = await fetch(HAMQSL_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })

  if (!response.ok)
    throw new Error(
      `HamQSL responded ${response.status} ${response.statusText}`
    )

  const conditions = parseSolarXML(await response.text())
  cache = { conditions, fetchedAt: Date.now() }
  return conditions
}

export function parseSolarXML(xml: string): BandConditions {
  const parsed = parser.parse(xml) as { solar?: { solardata?: SolarData } }
  const data = parsed.solar?.solardata
  if (!data) throw new Error('unexpected HamQSL response: no <solardata>')

  return {
    source: SOURCE,
    updated: parseTimestamp(readText(data, 'updated')),
    solar: {
      solarFlux: readNumber(data, 'solarflux'),
      sunspots: readNumber(data, 'sunspots'),
      aIndex: readNumber(data, 'aindex'),
      kIndex: readNumber(data, 'kindex'),
      xray: readText(data, 'xray'),
      solarWind: readNumber(data, 'solarwind'),
      magneticField: readNumber(data, 'magneticfield'),
      protonFlux: readNumber(data, 'protonflux'),
      /* the feed really does spell it this way */
      electronFlux: readNumber(data, 'electonflux'),
      aurora: readNumber(data, 'aurora')
    },
    geomagneticField: labelGeomagneticField(readText(data, 'geomagfield')),
    signalNoise: readText(data, 'signalnoise'),
    hf: parseHF_Conditions(data),
    vhf: parseVHF_Conditions(data)
  }
}

function parseHF_Conditions(data: SolarData): HF_BandCondition[] {
  const conditions = data.calculatedconditions as
    { band?: RawElement[] } | undefined

  const byBands = new Map<string, HF_BandCondition>()

  for (const { name, time, text } of conditions?.band ?? []) {
    if (!name) continue

    const condition = byBands.get(name) ?? {
      bands: name,
      day: 'Unknown',
      night: 'Unknown'
    }

    if (time === 'day') condition.day = toRating(text)
    if (time === 'night') condition.night = toRating(text)
    byBands.set(name, condition)
  }

  return [...byBands.values()]
}

function parseVHF_Conditions(data: SolarData): VHF_Condition[] {
  const conditions = data.calculatedvhfconditions as
    { phenomenon?: RawElement[] } | undefined

  return (conditions?.phenomenon ?? []).map(({ name, location, text }) => ({
    phenomenon: PHENOMENON_LABELS[name ?? ''] ?? name ?? 'Unknown',
    location: labelLocation(location ?? ''),
    status: text ?? 'Unknown'
  }))
}

function parseTimestamp(text: string | null): string | null {
  const match = text?.match(HAMQSL_TIMESTAMP)
  if (!match) return null

  const [, day, month, year, hour, minute] = match
  const monthIndex = MONTHS.indexOf(month)
  if (monthIndex === -1) return null

  const timestamp = Date.UTC(
    Number(year),
    monthIndex,
    Number(day),
    Number(hour),
    Number(minute)
  )

  return new Date(timestamp).toISOString()
}

function toRating(text: string | undefined): BandRating {
  return RATINGS.find(rating => rating === text) ?? 'Unknown'
}

function labelGeomagneticField(text: string | null): string | null {
  if (text === null) return null
  return GEOMAGNETIC_LABELS[text] ?? text
}

function labelLocation(location: string): string {
  return LOCATION_LABELS[location] ?? location.replace(UNDERSCORES, ' ')
}

function readText(data: SolarData, key: string): string | null {
  const value = data[key]
  return typeof value === 'string' && value !== '' ? value : null
}

function readNumber(data: SolarData, key: string): number | null {
  const text = readText(data, key)
  if (text === null) return null

  const value = Number(text)
  return Number.isFinite(value) ? value : null
}
