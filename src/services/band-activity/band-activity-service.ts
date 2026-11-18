import type { StationService } from '@services/station/station-service'

import { ActivityWindow } from './activity-window'
import { squaresWithin } from './grid-squares'
import { distanceKm, locatorCenter } from './maidenhead'
import type { Coordinates } from './maidenhead'
import { BANDS, CONTINENTS } from './model'
import type { BandActivity, ReceiverArea, Reception } from './model'
import { PSKReporterFeed } from './pskreporter-feed'

const SOURCE = 'PSKReporter (pskreporter.info), via its MQTT feed'
const WINDOW_MINUTES = 15
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000

/* near enough that receivers share our propagation, far enough for plenty
   of them; a fixed radius until views get settings of their own */
const RADIUS_MILES = 250
const KM_PER_MILE = 1.609344
const RADIUS_KM = RADIUS_MILES * KM_PER_MILE

/* with no one asking for a while, stop listening; a view polls far more
   often than this, so an open view keeps the feed alive */
const IDLE_TIMEOUT_MS = 10 * 60 * 1000
const IDLE_CHECK_MS = 60 * 1000

/* listens to PSKReporter only while someone wants band activity: the
   first snapshot opens the feed, and going unasked-for closes it */
export class BandActivityService {
  #station: StationService
  #feed = new PSKReporterFeed()
  #window = new ActivityWindow(WINDOW_MS)
  #area: ReceiverArea | null = null
  #center: Coordinates | null = null
  #listeningSince: number | null = null
  #lastAsked = 0

  constructor(station: StationService) {
    this.#station = station

    setInterval(() => this.#closeIfIdle(), IDLE_CHECK_MS).unref()
  }

  async snapshot(): Promise<BandActivity> {
    const now = Date.now()
    this.#lastAsked = now

    const { grid } = await this.#station.get()
    const center = grid === null ? null : locatorCenter(grid)

    if (grid === null || center === null) {
      this.#stop()
    } else {
      this.#listenNear(grid, center)
    }

    const { receivers, cells } = this.#window.tally(now)

    return {
      source: SOURCE,
      updated: new Date(now).toISOString(),
      windowMinutes: WINDOW_MINUTES,
      area: this.#area,
      feed: this.#feed.state,
      listeningSince: toISO(this.#listeningSince),
      receivers,
      bands: BANDS,
      continents: CONTINENTS,
      cells
    }
  }

  /* reconnects only when the station's grid changes */
  #listenNear(grid: string, center: Coordinates) {
    if (this.#feed.open && this.#area?.grid === grid) return

    this.#window.clear()
    this.#feed.connect(squaresWithin(center, RADIUS_KM), reception =>
      this.#hear(reception)
    )

    this.#area = { grid, radiusMiles: RADIUS_MILES }
    this.#center = center
    this.#listeningSince = Date.now()
  }

  /* the broker sends whole squares, so the circle's edge is cut here */
  #hear(reception: Reception) {
    const receiver = locatorCenter(reception.receiverGrid)
    if (receiver === null || this.#center === null) return

    if (distanceKm(this.#center, receiver) <= RADIUS_KM)
      this.#window.add(reception)
  }

  #closeIfIdle() {
    if (this.#feed.open && Date.now() - this.#lastAsked > IDLE_TIMEOUT_MS)
      this.#stop()
  }

  #stop() {
    this.#feed.close()
    this.#window.clear()
    this.#area = null
    this.#center = null
    this.#listeningSince = null
  }
}

function toISO(time: number | null): string | null {
  return time === null ? null : new Date(time).toISOString()
}
