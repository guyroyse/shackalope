import type { StationStore } from '@stores/station-store'

import { applyStationUpdate, DEFAULT_STATION } from './model'
import type { Station, StationUpdate } from './model'

export class StationService {
  #store: StationStore

  constructor(store: StationStore) {
    this.#store = store
  }

  async get(): Promise<Station> {
    const record = await this.#store.read()
    if (typeof record !== 'object' || record === null) return DEFAULT_STATION

    return { ...DEFAULT_STATION, ...(record as Partial<Station>) }
  }

  async update(update: StationUpdate): Promise<Station> {
    const station = applyStationUpdate(await this.get(), update)
    await this.#store.write(station)
    return station
  }
}
