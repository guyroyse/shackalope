/* every URI this server serves, in one place; safe to import from views */

export const BAND_CONDITIONS_URI = 'band-conditions://current'
export const BAND_ACTIVITY_URI = 'band-activity://current'
export const STATION_URI = 'station://current'

export const SOLAR_IMAGE_TEMPLATE = 'solar-image://sdo/{id}'
export const SOLAR_IMAGE_PREFIX = 'solar-image://'

export const QSL_IMAGE_TEMPLATE = 'qsl-image://{name}'

export const BAND_CONDITIONS_VIEW_URI =
  'ui://band-conditions/band-conditions.html'
export const BAND_ACTIVITY_VIEW_URI = 'ui://band-activity/band-activity.html'
export const QSL_CARD_VIEW_URI = 'ui://qsl-card/qsl-card.html'

export function solarImageURI(id: string): string {
  return `solar-image://sdo/${id}`
}

export function qslImageURI(name: string): string {
  return `qsl-image://${name}`
}
