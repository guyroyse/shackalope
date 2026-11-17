import { randomUUID } from 'node:crypto'
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile
} from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'

const TEMPORARY_EXTENSION = '.tmp'

/* the folder that holds everything the user would want to keep, as plain files;
   paths given to it are relative to that folder and can't escape it */
export class Vault {
  #root: string

  constructor(root: string) {
    this.#root = resolve(root)
  }

  get root(): string {
    return this.#root
  }

  async readBytes(path: string): Promise<Buffer | null> {
    try {
      return await readFile(this.#resolve(path))
    } catch (error) {
      if (isMissing(error)) return null
      throw error
    }
  }

  async readText(path: string): Promise<string | null> {
    const bytes = await this.readBytes(path)
    return bytes === null ? null : bytes.toString('utf8')
  }

  async readJSON(path: string): Promise<unknown | null> {
    const text = await this.readText(path)
    return text === null ? null : JSON.parse(text)
  }

  /* written beside the target and renamed over it, so a crash never
     leaves a half-written file */
  async writeBytes(path: string, bytes: Buffer) {
    const target = this.#resolve(path)
    const temporary = `${target}.${randomUUID()}${TEMPORARY_EXTENSION}`

    await mkdir(dirname(target), { recursive: true })

    try {
      await writeFile(temporary, bytes)
      await rename(temporary, target)
    } catch (error) {
      await rm(temporary, { force: true })
      throw error
    }
  }

  async writeText(path: string, text: string) {
    await this.writeBytes(path, Buffer.from(text, 'utf8'))
  }

  async writeJSON(path: string, value: unknown) {
    await this.writeText(path, `${JSON.stringify(value, null, 2)}\n`)
  }

  async list(directory: string): Promise<string[]> {
    try {
      const entries = await readdir(this.#resolve(directory), {
        withFileTypes: true
      })

      return entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name)
        .filter(name => !name.endsWith(TEMPORARY_EXTENSION))
    } catch (error) {
      if (isMissing(error)) return []
      throw error
    }
  }

  async remove(path: string): Promise<boolean> {
    try {
      await rm(this.#resolve(path))
      return true
    } catch (error) {
      if (isMissing(error)) return false
      throw error
    }
  }

  #resolve(path: string): string {
    const full = resolve(this.#root, path)
    const inside = full === this.#root || full.startsWith(`${this.#root}${sep}`)

    if (!inside) throw new Error(`path escapes the vault: ${path}`)
    return full
  }
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT'
}
