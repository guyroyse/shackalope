export type Coordinates = {
  latitude: number
  longitude: number
}

/* pairs alternate letters and digits: field (A–R), square (0–9), subsquare
   (a–x), extended square (0–9), and so on; 4 to 10 characters in practice */
const LOCATOR = /^[A-R]{2}([0-9]{2}([A-X]{2}([0-9]{2}([A-X]{2})?)?)?)?$/i
const LETTER_A = 'A'.charCodeAt(0)
const EARTH_RADIUS_KM = 6371

/* each pair divides the one before: letters by 18 or 24, digits by 10 */
const DIVISIONS = [18, 10, 24, 10, 24]

/* the center of the locator's area, or null if it isn't a locator */
export function locatorCenter(locator: string): Coordinates | null {
  if (!LOCATOR.test(locator)) return null

  const upper = locator.toUpperCase()
  let longitude = -180
  let latitude = -90
  let width = 360
  let height = 180

  for (let pair = 0; pair * 2 < upper.length; pair++) {
    const division = DIVISIONS[pair]
    width /= division
    height /= division

    longitude += width * pairValue(upper[pair * 2])
    latitude += height * pairValue(upper[pair * 2 + 1])
  }

  return { latitude: latitude + height / 2, longitude: longitude + width / 2 }
}

/* great-circle distance, by the haversine formula */
export function distanceKm(from: Coordinates, to: Coordinates): number {
  const latitudeChange = radians(to.latitude - from.latitude)
  const longitudeChange = radians(to.longitude - from.longitude)

  const haversine =
    Math.sin(latitudeChange / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeChange / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine))
}

function pairValue(character: string): number {
  const digit = Number(character)
  return Number.isNaN(digit) ? character.charCodeAt(0) - LETTER_A : digit
}

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180
}
