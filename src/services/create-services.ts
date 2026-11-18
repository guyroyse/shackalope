import { CardImageStore } from '@stores/card-image-store'
import { StationStore } from '@stores/station-store'
import type { Vault } from '@stores/vault'

import { BandActivityService } from './band-activity/band-activity-service'
import { CardImageService } from './qsl-card/card-images'
import { StationService } from './station/station-service'

/* the services that keep state, wired to their stores in one vault */
export type Services = {
  station: StationService
  cardImages: CardImageService
  bandActivity: BandActivityService
}

export function createServices(vault: Vault): Services {
  const station = new StationService(new StationStore(vault))

  return {
    station,
    cardImages: new CardImageService(new CardImageStore(vault)),
    bandActivity: new BandActivityService(station)
  }
}
