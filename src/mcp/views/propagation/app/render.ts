import { renderHF_Row } from '@mcp/views/shared/ratings'
import { renderReadout } from '@mcp/views/shared/readouts'
import type { Readout } from '@mcp/views/shared/readouts'
import type { BandActivity } from '@services/band-activity/model'
import {
  readA_Index,
  readBz,
  readKIndex,
  readSolarWind
} from '@services/band-conditions/levels'
import type { BandConditions } from '@services/band-conditions/model'

type Tier = {
  level: number
  atLeast: number
}

/* a whole band, summed across continents, runs from none to a few hundred
   stations, so the tiers grow roughly geometrically */
const TIERS: Tier[] = [
  { level: 4, atLeast: 60 },
  { level: 3, atLeast: 20 },
  { level: 2, atLeast: 5 },
  { level: 1, atLeast: 1 }
]

const METERS = /m$/

export function renderConditions(
  panel: HTMLElement,
  conditions: BandConditions
) {
  slot(panel, 'updated').textContent = formatUpdated(conditions.updated)
  slot(panel, 'readouts').replaceChildren(
    ...buildReadouts(conditions).map(renderReadout)
  )
  slot(panel, 'hf-rows').replaceChildren(...conditions.hf.map(renderHF_Row))
  panel.dataset.state = 'ready'
}

export function renderActivity(panel: HTMLElement, activity: BandActivity) {
  const totals = stationsByBand(activity)

  panel.dataset.activity = activity.area === null ? 'no-grid' : 'ready'
  slot(panel, 'activity-label').textContent = describeActivity(activity)
  slot(panel, 'strip').replaceChildren(
    ...activity.bands.map(band => bandItem(band, totals.get(band) ?? 0))
  )

  const notice = slot(panel, 'notice')
  const message = noticeFor(activity)
  notice.hidden = message === null
  notice.textContent = message ?? ''
}

/* which tier each band is in, to tell whether the strip has changed much */
export function activitySignature(activity: BandActivity): string {
  const totals = stationsByBand(activity)
  return activity.bands
    .map(band => `${band}:${tierOf(totals.get(band) ?? 0)}`)
    .join()
}

export function setRefreshing(panel: HTMLElement, refreshing: boolean) {
  const button = slot(panel, 'refresh') as HTMLButtonElement
  button.disabled = refreshing
  button.textContent = refreshing ? 'Refreshing…' : 'Refresh'
}

export function slot(panel: HTMLElement, name: string): HTMLElement {
  const element = panel.querySelector<HTMLElement>(`[data-slot="${name}"]`)
  if (!element) throw new Error(`missing slot: ${name}`)
  return element
}

function buildReadouts({ solar }: BandConditions): Readout[] {
  return [
    { label: 'Solar flux', value: solar.solarFlux },
    { label: 'Sunspots', value: solar.sunspots },
    {
      label: 'K index',
      value: solar.kIndex,
      reading: readKIndex(solar.kIndex)
    },
    {
      label: 'A index',
      value: solar.aIndex,
      reading: readA_Index(solar.aIndex)
    },
    {
      label: 'Bz',
      value: solar.magneticField,
      unit: 'nT',
      reading: readBz(solar.magneticField)
    },
    {
      label: 'Solar wind',
      value: round(solar.solarWind),
      unit: 'km/s',
      reading: readSolarWind(solar.solarWind)
    }
  ]
}

/* a sender is on one continent, so summing the cells counts each once */
function stationsByBand({ cells }: BandActivity): Map<string, number> {
  const totals = new Map<string, number>()
  for (const { band, stations } of cells)
    totals.set(band, (totals.get(band) ?? 0) + stations)
  return totals
}

function bandItem(band: string, stations: number) {
  const item = document.createElement('li')
  const count = document.createElement('span')
  const name = document.createElement('span')
  const spoken = document.createElement('span')

  count.className = 'strip-count'
  count.dataset.tier = String(tierOf(stations))
  count.textContent = String(stations)
  count.setAttribute('aria-hidden', 'true')

  name.className = 'strip-band'
  name.textContent = band.replace(METERS, '')
  name.setAttribute('aria-hidden', 'true')

  /* the visible cells are terse, so screen readers get a sentence instead */
  spoken.className = 'visually-hidden'
  spoken.textContent = `${band}: ${describeStations(stations)}`

  item.append(count, name, spoken)
  return item
}

function describeActivity({ area, windowMinutes, feed }: BandActivity) {
  if (area === null) return 'Band activity · no station grid set'
  if (feed === 'connecting') return 'Band activity · connecting to PSKReporter'

  const near = `within ${area.radiusMiles} mi of ${area.grid}`
  return `Band activity · stations heard ${near}, last ${windowMinutes} min`
}

function noticeFor(activity: BandActivity): string | null {
  const { area, listeningSince, updated, windowMinutes } = activity

  if (area === null)
    return "Set your station's grid locator to see what's being heard near you."

  if (listeningSince === null) return null

  const minutes = Math.floor(
    (Date.parse(updated) - Date.parse(listeningSince)) / 60_000
  )

  return minutes < windowMinutes
    ? `Just started listening: the strip fills in over ${windowMinutes} minutes.`
    : null
}

function describeStations(stations: number): string {
  if (stations === 0) return 'nothing heard'
  return stations === 1 ? '1 station heard' : `${stations} stations heard`
}

function tierOf(stations: number): number {
  return TIERS.find(({ atLeast }) => stations >= atLeast)?.level ?? 0
}

function formatUpdated(updated: string | null): string {
  if (updated === null) return 'Update time unknown'

  const iso = new Date(updated).toISOString()
  return `Updated ${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`
}

function round(value: number | null): number | null {
  return value === null ? null : Math.round(value)
}
