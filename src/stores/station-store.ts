import type { Vault } from './vault'

const STATION_FILE = 'station.json'

export class StationStore {
  #vault: Vault

  constructor(vault: Vault) {
    this.#vault = vault
  }

  async read(): Promise<unknown | null> {
    return this.#vault.readJSON(STATION_FILE)
  }

  async write(record: object) {
    await this.#vault.writeJSON(STATION_FILE, record)
  }
}
