import type { ActivityCell, BandActivity } from './model'

const NO_GRID = `No band activity: the station has no Maidenhead grid, so \
there's nowhere to listen from. Set one with set_station.`

export function summarizeBandActivity(activity: BandActivity): string {
  const { area, windowMinutes, receivers, bands, cells } = activity

  if (area === null) return NO_GRID

  const heading = [
    `Signals heard by ${receivers} PSKReporter receivers`,
    `within ${area.radiusMiles} miles of grid ${area.grid},`,
    `over the last ${windowMinutes} minutes,`,
    `by band and the sender's continent.`
  ]

  const lines = [heading.join(' '), describeListening(activity)].filter(Boolean)

  const quiet: string[] = []

  for (const band of bands) {
    const heard = cells
      .filter(cell => cell.band === band)
      .sort((a, b) => b.stations - a.stations)

    if (heard.length === 0) {
      quiet.push(band)
    } else {
      lines.push(`${band}: ${heard.map(describeCell).join('; ')}`)
    }
  }

  if (quiet.length > 0) lines.push(`Nothing heard on ${quiet.join(', ')}.`)
  return lines.join('\n')
}

function describeCell({ continent, stations, strongest }: ActivityCell) {
  const count = stations === 1 ? '1 station' : `${stations} stations`
  const snr = strongest.snr > 0 ? `+${strongest.snr}` : String(strongest.snr)
  return `${continent} ${count} (strongest ${strongest.callsign} ${snr} dB)`
}

function describeListening(activity: BandActivity): string {
  const { feed, listeningSince, updated, windowMinutes } = activity
  if (feed === 'connecting') return 'Connecting to the PSKReporter feed now.'
  if (feed === 'reconnecting') return 'Reconnecting to the PSKReporter feed.'
  if (listeningSince === null) return ''

  const minutes = Math.floor(
    (Date.parse(updated) - Date.parse(listeningSince)) / 60_000
  )

  if (minutes >= windowMinutes)
    return `Listening since ${listeningSince.slice(11, 16)} UTC.`

  const span = minutes === 1 ? '1 minute' : `${minutes} minutes`
  return `Listening for ${span} so far, so the window is still filling.`
}
