import type { QSL_Card } from '@services/qsl-card/model'
import type { Station } from '@services/station/model'

const ZERO = /0/g
const SLASHED_ZERO = 'Ø'

export function renderQSL_Card(card: HTMLElement, qsl: QSL_Card) {
  const { station, contact, remarks } = qsl

  /* hams slash their zeros so they can't be misread as the letter O */
  setField(
    card,
    'station-callsign',
    station.callsign.replace(ZERO, SLASHED_ZERO)
  )
  setField(card, 'station-details', describeStation(station))
  setField(card, 'sign-off-callsign', station.callsign)

  setField(card, 'contact-callsign', contact.callsign)
  setField(card, 'contact-name', contact.operatorName ?? '')
  setField(card, 'date', contact.date)
  setField(card, 'time', contact.time)
  setField(card, 'frequency', contact.frequency?.toString() ?? '—')
  setField(card, 'band', contact.band ?? '—')
  setField(card, 'mode', contact.mode)
  setField(card, 'rst', contact.rst ?? '—')
  setField(card, 'remarks', remarks ?? thanks(contact.operatorName))

  card.dataset.state = 'confirmed'
}

export function showPhoto(card: HTMLElement, source: string, alt: string) {
  const photo = card.querySelector<HTMLImageElement>('[data-slot="photo"]')!

  photo.onload = () => (card.dataset.hasImage = 'true')
  photo.alt = alt
  photo.src = source
}

/* a later card without a background mustn't keep showing the last one */
export function hidePhoto(card: HTMLElement) {
  const photo = card.querySelector<HTMLImageElement>('[data-slot="photo"]')!

  photo.onload = null
  photo.removeAttribute('src')
  card.dataset.hasImage = 'false'
}

function describeStation({ operatorName, qth, grid }: Station): string {
  return [operatorName, qth, grid && `Grid ${grid}`].filter(Boolean).join(' · ')
}

function thanks(operatorName: string | null): string {
  return operatorName ? `Tnx for the QSO, ${operatorName}!` : 'Tnx for the QSO!'
}

function setField(card: HTMLElement, field: string, value: string) {
  const elements = card.querySelectorAll(`[data-field="${field}"]`)
  for (const element of elements) element.textContent = value
}
