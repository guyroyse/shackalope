import type { QSL_Card } from './model'

export function describeCard({ station, contact, image }: QSL_Card): string {
  const where = [
    contact.frequency && `${contact.frequency} MHz`,
    contact.band && `(${contact.band})`
  ]
    .filter(Boolean)
    .join(' ')

  const details = [
    `${contact.date} ${contact.time} UTC`,
    where,
    contact.mode,
    contact.rst && `RST ${contact.rst}`
  ]
    .filter(Boolean)
    .join(', ')

  const imageNote = image
    ? `Card image: ${image.name}`
    : 'No card image saved yet; save one with save_qsl_image'

  const route = `${station.callsign} to ${contact.callsign}`
  return `QSL card from ${route}: ${details}. ${imageNote}.`
}
