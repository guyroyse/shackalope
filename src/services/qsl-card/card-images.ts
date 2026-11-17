import type { CardImageStore } from '@stores/card-image-store'

export type CardImage = {
  name: string
  mimeType: string
}

export type ImageSource = { url: string } | { data: string }

type ImageFormat = {
  extension: string
  matches: (bytes: Buffer) => boolean
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 15_000

const NON_NAME_CHARACTERS = /[^a-z0-9]+/g
const EDGE_HYPHENS = /^-+|-+$/g
const HTTP_URL = /^https?:\/\//i

/* identified by magic bytes, so a mislabeled upload can't sneak through */
const FORMATS: ImageFormat[] = [
  {
    extension: '.png',
    matches: bytes => bytes.subarray(0, 4).toString('hex') === '89504e47'
  },
  {
    extension: '.jpg',
    matches: bytes => bytes.subarray(0, 3).toString('hex') === 'ffd8ff'
  },
  {
    extension: '.gif',
    matches: bytes => bytes.subarray(0, 4).toString('ascii') === 'GIF8'
  },
  {
    extension: '.webp',
    matches: bytes =>
      bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  }
]

export class CardImageService {
  #store: CardImageStore

  constructor(store: CardImageStore) {
    this.#store = store
  }

  async list(): Promise<CardImage[]> {
    const images = await this.#store.list()
    return images.map(({ name, mimeType }) => ({ name, mimeType }))
  }

  /* a named image, or else the only one, or else one at random */
  async choose(requested: string | null): Promise<CardImage | null> {
    const images = await this.list()

    if (requested !== null) {
      const name = toImageName(requested)
      const image = images.find(image => image.name === name)
      if (image) return image

      const available = images.map(image => image.name).join(', ') || 'none'
      throw new Error(`no QSL card image named "${name}" (saved: ${available})`)
    }

    if (images.length === 0) return null
    return images[Math.floor(Math.random() * images.length)]
  }

  async read(
    requestedName: string
  ): Promise<{ data: string; mimeType: string }> {
    const name = toImageName(requestedName)
    const image = await this.#store.read(name)
    if (!image) throw new Error(`no QSL card image named "${name}"`)

    return { data: image.bytes.toString('base64'), mimeType: image.mimeType }
  }

  async save(requestedName: string, source: ImageSource): Promise<CardImage> {
    const name = toImageName(requestedName)
    const bytes =
      'url' in source ? await download(source.url) : decode(source.data)

    if (bytes.length > MAX_IMAGE_BYTES)
      throw new Error(
        `image is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB`
      )

    const format = FORMATS.find(format => format.matches(bytes))
    if (!format) throw new Error('not a PNG, JPEG, GIF, or WebP image')

    const { mimeType } = await this.#store.write(name, format.extension, bytes)
    return { name, mimeType }
  }

  async delete(requestedName: string): Promise<boolean> {
    return this.#store.delete(toImageName(requestedName))
  }
}

export function toImageName(raw: string): string {
  const name = raw
    .toLowerCase()
    .replace(NON_NAME_CHARACTERS, '-')
    .replace(EDGE_HYPHENS, '')

  if (name === '') throw new Error(`"${raw}" can't be used as an image name`)
  return name
}

async function download(url: string): Promise<Buffer> {
  if (!HTTP_URL.test(url))
    throw new Error('only http and https URLs are supported')

  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })

  if (!response.ok)
    throw new Error(
      `download failed: ${response.status} ${response.statusText}`
    )

  const length = Number(response.headers.get('content-length'))
  if (length > MAX_IMAGE_BYTES)
    throw new Error(`image is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB`)

  return Buffer.from(await response.arrayBuffer())
}

function decode(data: string): Buffer {
  const bytes = Buffer.from(data, 'base64')
  if (bytes.length === 0) throw new Error('image data is empty or not base64')
  return bytes
}
