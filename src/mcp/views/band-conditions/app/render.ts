import type {
  BandConditions,
  BandRating,
  HF_BandCondition,
  VHF_Condition
} from '@services/band-conditions/model'

export type SunView = {
  uri: string
  title: string
  description: string
}

type Tile = {
  label: string
  value: string | number | null
  unit?: string
}

const HYPHEN = /-/g

export function renderBandConditions(
  panel: HTMLElement,
  conditions: BandConditions
) {
  slot(panel, 'updated').textContent = formatUpdated(conditions.updated)
  slot(panel, 'hf-rows').replaceChildren(...conditions.hf.map(renderHF_Row))
  slot(panel, 'tiles').replaceChildren(
    ...buildTiles(conditions).map(renderTile)
  )
  slot(panel, 'vhf-list').replaceChildren(...conditions.vhf.map(renderVHF_Item))
  panel.dataset.state = 'ready'
}

export function renderSunPicker(
  panel: HTMLElement,
  views: SunView[],
  onSelect: (view: SunView) => void
) {
  const buttons = views.map(view => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = view.title
    button.title = view.description
    button.addEventListener('click', () => {
      markSelected(buttons, views.indexOf(view))
      onSelect(view)
    })
    return button
  })

  slot(panel, 'sun-views').replaceChildren(...buttons)
  if (views.length > 0) markSelected(buttons, 0)
}

export function showSunImage(
  panel: HTMLElement,
  view: SunView,
  source: string | null
) {
  const image = slot(panel, 'sun-image') as HTMLImageElement
  const caption = slot(panel, 'sun-caption')

  if (source === null) {
    image.removeAttribute('src')
    caption.textContent = `${view.title} image unavailable right now`
    return
  }

  image.src = source
  image.alt = `The sun right now, ${view.title.toLowerCase()} view`
  caption.textContent = view.description
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

function markSelected(buttons: HTMLButtonElement[], selectedIndex: number) {
  buttons.forEach((button, index) =>
    button.setAttribute('aria-pressed', String(index === selectedIndex))
  )
}

function buildTiles(conditions: BandConditions): Tile[] {
  const { solar } = conditions
  return [
    { label: 'Solar flux', value: solar.solarFlux },
    { label: 'Sunspots', value: solar.sunspots },
    { label: 'A index', value: solar.aIndex },
    { label: 'K index', value: solar.kIndex },
    { label: 'X-ray', value: solar.xray },
    { label: 'Solar wind', value: round(solar.solarWind), unit: 'km/s' },
    { label: 'Bz', value: solar.magneticField, unit: 'nT' },
    { label: 'Geomagnetic', value: conditions.geomagneticField },
    { label: 'Noise', value: conditions.signalNoise }
  ]
}

function renderHF_Row({ bands, day, night }: HF_BandCondition) {
  const row = document.createElement('tr')
  row.append(
    cell(bands.replace(HYPHEN, '–'), 'bands'),
    ratingCell(day),
    ratingCell(night)
  )
  return row
}

function renderVHF_Item({ phenomenon, location, status }: VHF_Condition) {
  const item = document.createElement('li')
  const name = document.createElement('span')
  const state = document.createElement('span')

  name.textContent = `${phenomenon}, ${location}`
  state.textContent = status
  state.className = 'vhf-status'

  item.append(name, state)
  return item
}

function renderTile({ label, value, unit }: Tile) {
  const tile = document.createElement('div')
  const labelElement = document.createElement('p')
  const valueElement = document.createElement('p')

  tile.className = 'tile'
  labelElement.className = 'tile-label'
  valueElement.className = 'tile-value'

  labelElement.textContent = label
  valueElement.textContent = value === null ? '—' : String(value)

  if (unit && value !== null) {
    const unitElement = document.createElement('span')
    unitElement.className = 'tile-unit'
    unitElement.textContent = unit
    valueElement.append(unitElement)
  }

  tile.append(labelElement, valueElement)
  return tile
}

function ratingCell(rating: BandRating) {
  const tableCell = document.createElement('td')
  const wrapper = document.createElement('span')
  const icon = document.createElement('span')

  wrapper.className = 'rating'
  wrapper.dataset.rating = rating
  icon.className = 'rating-icon'
  icon.setAttribute('aria-hidden', 'true')

  wrapper.append(icon, rating)
  tableCell.append(wrapper)
  return tableCell
}

function cell(text: string, className: string) {
  const tableCell = document.createElement('td')
  tableCell.className = className
  tableCell.textContent = text
  return tableCell
}

function formatUpdated(updated: string | null): string {
  if (updated === null) return 'Update time unknown'

  const iso = new Date(updated).toISOString()
  return `Updated ${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`
}

function round(value: number | null): number | null {
  return value === null ? null : Math.round(value)
}
