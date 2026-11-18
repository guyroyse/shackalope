import { CONTINENT_NAMES } from '@services/band-activity/model'
import type {
  ActivityCell,
  BandActivity,
  Continent
} from '@services/band-activity/model'

type Tier = {
  level: number
  label: string
  atLeast: number
}

/* station counts per cell span 1 to a few hundred, so tiers grow roughly
   geometrically; the legend reads these same labels */
const TIERS: Tier[] = [
  { level: 4, label: '15+', atLeast: 15 },
  { level: 3, label: '5–14', atLeast: 5 },
  { level: 2, label: '2–4', atLeast: 2 },
  { level: 1, label: '1', atLeast: 1 }
]

/* a cell not heard from in this long is drawn faded: the band may be closing */
const STALE_MS = 5 * 60 * 1000

export function renderBandActivity(
  panel: HTMLElement,
  activity: BandActivity,
  selected: string | null
) {
  const { area, feed, bands, continents, cells } = activity
  const byKey = new Map(cells.map(cell => [cellKey(cell), cell]))
  const now = Date.parse(activity.updated)

  panel.dataset.state = area === null ? 'no-grid' : 'ready'
  panel.dataset.feed = feed ?? 'closed'

  slot(panel, 'where').textContent = describeWhere(activity)
  slot(panel, 'live-label').textContent = describeFeed(activity)
  renderNotice(panel, activity)

  slot(panel, 'continents').replaceChildren(
    headerCell('', 'col'),
    ...continents.map(continent => continentHeader(continent))
  )

  slot(panel, 'rows').replaceChildren(
    ...bands.map(band =>
      bandRow(band, continents, byKey, now, activity.windowMinutes)
    )
  )

  showDetail(panel, activity, selected)
}

export function renderLegend(panel: HTMLElement) {
  const swatches = [...TIERS].reverse().map(({ level, label }) => {
    const item = document.createElement('span')
    const swatch = document.createElement('span')

    item.className = 'legend-item'
    swatch.className = 'legend-swatch'
    swatch.dataset.tier = String(level)
    swatch.setAttribute('aria-hidden', 'true')

    item.append(swatch, label)
    return item
  })

  const stale = document.createElement('span')
  const staleSwatch = document.createElement('span')
  stale.className = 'legend-item'
  staleSwatch.className = 'legend-swatch'
  staleSwatch.dataset.tier = '3'
  staleSwatch.dataset.stale = 'true'
  staleSwatch.setAttribute('aria-hidden', 'true')
  stale.append(staleSwatch, 'quiet 5+ min')

  const title = document.createElement('span')
  title.className = 'legend-title'
  title.textContent = 'Stations'

  slot(panel, 'legend').replaceChildren(title, ...swatches, stale)
}

export function showDetail(
  panel: HTMLElement,
  activity: BandActivity,
  selected: string | null
) {
  const detail = slot(panel, 'detail')

  if (selected === null || activity.area === null) {
    detail.textContent = 'Point at a cell for details.'
    return
  }

  const [band, continent] = selected.split(' ') as [string, Continent]
  const cell = activity.cells.find(candidate => cellKey(candidate) === selected)

  detail.textContent = cell
    ? describeCell(cell, Date.parse(activity.updated))
    : describeSilence(band, continent, activity.windowMinutes)
}

export function cellKey({ band, continent }: ActivityCell): string {
  return `${band} ${continent}`
}

export function slot(panel: HTMLElement, name: string): HTMLElement {
  const element = panel.querySelector<HTMLElement>(`[data-slot="${name}"]`)
  if (!element) throw new Error(`missing slot: ${name}`)
  return element
}

function bandRow(
  band: string,
  continents: Continent[],
  byKey: Map<string, ActivityCell>,
  now: number,
  windowMinutes: number
) {
  const row = document.createElement('tr')
  const label = headerCell(band, 'row')
  label.className = 'band'

  const cells = continents.map(continent => {
    const key = `${band} ${continent}`
    const cell = byKey.get(key) ?? null
    return activityCell(key, band, continent, cell, now, windowMinutes)
  })

  row.append(label, ...cells)
  return row
}

function activityCell(
  key: string,
  band: string,
  continent: Continent,
  cell: ActivityCell | null,
  now: number,
  windowMinutes: number
) {
  const tableCell = document.createElement('td')
  const button = document.createElement('button')

  button.type = 'button'
  button.className = 'cell'
  button.dataset.key = key
  button.dataset.tier = String(cell ? tierOf(cell.stations) : 0)

  if (cell && now - Date.parse(cell.lastHeard) > STALE_MS)
    button.dataset.stale = 'true'

  button.textContent = cell ? String(cell.stations) : ''
  button.setAttribute(
    'aria-label',
    cell
      ? describeCell(cell, now)
      : describeSilence(band, continent, windowMinutes)
  )

  tableCell.append(button)
  return tableCell
}

function continentHeader(continent: Continent) {
  const header = headerCell('', 'col')
  const abbreviation = document.createElement('abbr')

  abbreviation.title = CONTINENT_NAMES[continent]
  abbreviation.textContent = continent
  header.append(abbreviation)
  return header
}

function headerCell(text: string, scope: 'col' | 'row') {
  const header = document.createElement('th')
  header.scope = scope
  header.textContent = text
  return header
}

function renderNotice(panel: HTMLElement, activity: BandActivity) {
  const notice = slot(panel, 'notice')
  const message = noticeFor(activity)

  notice.hidden = message === null
  notice.textContent = message ?? ''
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
    ? `Just started listening: the grid fills in over ${windowMinutes} minutes.`
    : null
}

function describeWhere({ area, receivers, windowMinutes }: BandActivity) {
  if (area === null) return 'No station grid set'

  const heardBy = receivers === 1 ? '1 receiver' : `${receivers} receivers`
  const within = `within ${area.radiusMiles} mi of ${area.grid}`
  return `Heard by ${heardBy} ${within} · last ${windowMinutes} min`
}

function describeFeed({ feed, updated }: BandActivity): string {
  if (feed === 'connecting') return 'Connecting'
  if (feed === 'reconnecting') return 'Reconnecting'
  if (feed === null) return 'Not listening'

  return `Live · ${updated.slice(11, 19)} UTC`
}

function describeCell(cell: ActivityCell, now: number): string {
  const { band, continent, stations, reports, strongest, lastHeard } = cell

  const heard = stations === 1 ? '1 station' : `${stations} stations`
  const times = reports === 1 ? 'once' : `${reports} times`
  const snr = strongest.snr > 0 ? `+${strongest.snr}` : String(strongest.snr)
  const grid = strongest.grid ? ` (${strongest.grid.slice(0, 4)})` : ''
  const ago = describeAge(now - Date.parse(lastHeard))

  return [
    `${band} from ${CONTINENT_NAMES[continent]}: ${heard}, heard ${times}.`,
    `Strongest ${strongest.callsign}${grid} at ${snr} dB.`,
    `Last heard ${ago}.`
  ].join(' ')
}

function describeSilence(
  band: string,
  continent: Continent,
  windowMinutes: number
): string {
  const from = `${band} from ${CONTINENT_NAMES[continent]}`
  return `${from}: nothing heard in the last ${windowMinutes} minutes.`
}

function describeAge(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60_000)
  if (minutes < 1) return 'just now'
  return minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`
}

function tierOf(stations: number): number {
  return TIERS.find(({ atLeast }) => stations >= atLeast)?.level ?? 0
}
