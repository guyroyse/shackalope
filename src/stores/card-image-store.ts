import { basename, extname } from 'node:path'

import type { Vault } from './vault'

export type StoredImage = {
  name: string
  file: string
  mimeType: string
}

const IMAGE_DIRECTORY = 'qsl-images'

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}

export class CardImageStore {
  #vault: Vault

  constructor(vault: Vault) {
    this.#vault = vault
  }

  async list(): Promise<StoredImage[]> {
    const files = await this.#vault.list(IMAGE_DIRECTORY)

    return files
      .flatMap(file => {
        const extension = extname(file)
        const mimeType = MIME_TYPES_BY_EXTENSION[extension.toLowerCase()]
        return mimeType
          ? [{ name: basename(file, extension), file, mimeType }]
          : []
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async read(
    name: string
  ): Promise<{ bytes: Buffer; mimeType: string } | null> {
    const image = await this.#find(name)
    if (!image) return null

    const bytes = await this.#vault.readBytes(pathOf(image.file))
    return bytes && { bytes, mimeType: image.mimeType }
  }

  /* the new file lands first, then any older copy in another format goes */
  async write(
    name: string,
    extension: string,
    bytes: Buffer
  ): Promise<StoredImage> {
    const file = `${name}${extension}`
    await this.#vault.writeBytes(pathOf(file), bytes)

    const replaced = (await this.list()).filter(
      image => image.name === name && image.file !== file
    )
    for (const image of replaced) await this.#vault.remove(pathOf(image.file))

    return { name, file, mimeType: MIME_TYPES_BY_EXTENSION[extension] }
  }

  async delete(name: string): Promise<boolean> {
    const matches = (await this.list()).filter(image => image.name === name)
    for (const { file } of matches) await this.#vault.remove(pathOf(file))
    return matches.length > 0
  }

  async #find(name: string): Promise<StoredImage | null> {
    const images = await this.list()
    return images.find(image => image.name === name) ?? null
  }
}

function pathOf(file: string): string {
  return `${IMAGE_DIRECTORY}/${file}`
}
