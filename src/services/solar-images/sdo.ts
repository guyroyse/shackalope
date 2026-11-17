export type SolarImage = {
  id: string
  title: string
  description: string
}

type CachedImage = {
  bytes: Promise<Buffer>
  fetchedAt: number
}

const SDO_LATEST = 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_'

/* SDO refreshes its "latest" images about every 15 minutes */
const CACHE_TTL_MS = 15 * 60 * 1000
const FETCH_TIMEOUT_MS = 15_000

export const SOLAR_IMAGES: SolarImage[] = [
  {
    id: '211193171',
    title: 'Composite',
    description:
      'AIA 211, 193, and 171 Å blended: the corona at several temperatures'
  },
  {
    id: '0193',
    title: 'Corona',
    description:
      'AIA 193 Å: the corona and hot flare plasma; coronal holes look dark'
  },
  {
    id: '0304',
    title: 'Chromosphere',
    description: 'AIA 304 Å: the chromosphere, with prominences and filaments'
  },
  {
    id: 'HMIIC',
    title: 'Sunspots',
    description: 'HMI intensitygram: the visible surface, where sunspots show'
  },
  {
    id: 'HMIB',
    title: 'Magnetogram',
    description: 'HMI magnetogram: magnetic polarity across the surface'
  }
]

const cache = new Map<string, CachedImage>()

export function findSolarImage(id: string): SolarImage | null {
  return SOLAR_IMAGES.find(image => image.id === id) ?? null
}

/* caches the promise, so simultaneous requests share a single download */
export function fetchSolarImage(id: string): Promise<Buffer> {
  if (!findSolarImage(id)) throw new Error(`unknown solar image: ${id}`)

  const cached = cache.get(id)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS)
    return cached.bytes

  const bytes = download(id)
  cache.set(id, { bytes, fetchedAt: Date.now() })
  bytes.catch(() => cache.delete(id))
  return bytes
}

async function download(id: string): Promise<Buffer> {
  const response = await fetch(`${SDO_LATEST}${id}.jpg`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })

  if (!response.ok)
    throw new Error(`SDO responded ${response.status} ${response.statusText}`)

  return Buffer.from(await response.arrayBuffer())
}
