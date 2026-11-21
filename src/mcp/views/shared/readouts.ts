import type { Reading } from '@services/band-conditions/levels'

export type Readout = {
  label: string
  value: string | number | null
  unit?: string
  reading?: Reading
}

/* styled by components.css: a label, then a lit value colored by level */
export function renderReadout({ label, value, unit, reading }: Readout) {
  const readout = document.createElement('div')
  const labelElement = document.createElement('p')
  const valueElement = document.createElement('p')

  readout.className = 'readout'
  labelElement.className = 'label'
  valueElement.className = 'readout-value'

  if (reading) readout.dataset.level = reading.level

  labelElement.textContent = label
  if (reading?.note) labelElement.append(note(reading.note))

  valueElement.textContent = value === null ? '—' : String(value)
  if (unit && value !== null) valueElement.append(unitOf(unit))

  readout.append(labelElement, valueElement)
  return readout
}

function note(text: string) {
  const element = document.createElement('span')
  element.className = 'readout-note'
  element.textContent = text
  return element
}

function unitOf(text: string) {
  const element = document.createElement('span')
  element.className = 'readout-unit'
  element.textContent = text
  return element
}
