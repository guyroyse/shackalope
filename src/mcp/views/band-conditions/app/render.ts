import { renderHF_Row } from '@mcp/views/shared/ratings'
import { renderReadout } from '@mcp/views/shared/readouts'
import type { Readout } from '@mcp/views/shared/readouts'
import {
  readA_Index,
  readBz,
  readGeomagneticField,
  readKIndex,
  readSolarWind,
  readXray
} from '@services/band-conditions/levels'
import type {
  BandConditions,
  VHF_Condition
} from '@services/band-conditions/model'

export type SunView = {
  uri: string
  title: string
  description: string
}

export function renderBandConditions(
  panel: HTMLElement,
  conditions: BandConditions
) {
  slot(panel, 'updated').textContent = formatUpdated(conditions.updated)
  slot(panel, 'hf-rows').replaceChildren(...conditions.hf.map(renderHF_Row))
  slot(panel, 'readouts').replaceChildren(
    ...buildReadouts(conditions).map(renderReadout)
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
    button.className = 'button'
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

function buildReadouts(conditions: BandConditions): Readout[] {
  const { solar, geomagneticField, signalNoise } = conditions
  return [
    { label: 'Solar flux', value: solar.solarFlux },
    { label: 'Sunspots', value: solar.sunspots },
    { label: 'X-ray', value: solar.xray, reading: readXray(solar.xray) },
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
      label: 'Geomagnetic',
      value: geomagneticField,
      reading: readGeomagneticField(geomagneticField)
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
    },
    { label: 'Noise', value: signalNoise }
  ]
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

function formatUpdated(updated: string | null): string {
  if (updated === null) return 'Update time unknown'

  const iso = new Date(updated).toISOString()
  return `Updated ${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`
}

function round(value: number | null): number | null {
  return value === null ? null : Math.round(value)
}
