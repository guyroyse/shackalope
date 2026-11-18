import { BANDS } from './model'
import type { ActivityCell, Continent, Reception } from './model'

export type WindowTally = {
  receivers: number
  cells: ActivityCell[]
}

type CellTally = {
  band: string
  continent: Continent
  reports: number
  senders: Set<string>
  strongest: Reception
  lastHeard: number
}

const KNOWN_BANDS = new Set(BANDS)

/* the last few minutes of receptions, oldest first; a few thousand at the
   rates a handful of grid squares see, so tallying on demand is cheap */
export class ActivityWindow {
  #receptions: Reception[] = []
  #durationMs: number

  constructor(durationMs: number) {
    this.#durationMs = durationMs
  }

  add(reception: Reception) {
    if (!KNOWN_BANDS.has(reception.band)) return
    this.#receptions.push(reception)
  }

  clear() {
    this.#receptions = []
  }

  tally(now: number): WindowTally {
    const cutoff = now - this.#durationMs
    this.#dropOlderThan(cutoff)

    const cells = new Map<string, CellTally>()
    const receivers = new Set<string>()

    for (const reception of this.#receptions) {
      const { band, senderContinent, sender, snr, heardAt } = reception
      if (heardAt < cutoff) continue

      receivers.add(reception.receiver)

      const key = `${band} ${senderContinent}`
      const cell = cells.get(key)

      if (!cell) {
        cells.set(key, {
          band,
          continent: senderContinent,
          reports: 1,
          senders: new Set([sender]),
          strongest: reception,
          lastHeard: heardAt
        })
        continue
      }

      cell.reports++
      cell.senders.add(sender)
      if (snr > cell.strongest.snr) cell.strongest = reception
      cell.lastHeard = Math.max(cell.lastHeard, heardAt)
    }

    return { receivers: receivers.size, cells: [...cells.values()].map(toCell) }
  }

  /* receptions can arrive a little out of order, so this trims the front
     only up to the first one still inside the window */
  #dropOlderThan(cutoff: number) {
    const firstKept = this.#receptions.findIndex(
      ({ heardAt }) => heardAt >= cutoff
    )

    if (firstKept === -1) {
      this.#receptions = []
    } else if (firstKept > 0) {
      this.#receptions = this.#receptions.slice(firstKept)
    }
  }
}

function toCell({
  band,
  continent,
  reports,
  senders,
  strongest,
  lastHeard
}: CellTally): ActivityCell {
  return {
    band,
    continent,
    reports,
    stations: senders.size,
    strongest: {
      callsign: strongest.sender,
      grid: strongest.senderGrid,
      snr: strongest.snr
    },
    lastHeard: new Date(lastHeard).toISOString()
  }
}
