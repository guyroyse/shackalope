export type Continent = 'NA' | 'SA' | 'EU' | 'AF' | 'AS' | 'OC'

export type FeedState = 'connecting' | 'connected' | 'reconnecting'

/* one reception report: a receiver near us heard a sender somewhere */
export type Reception = {
  band: string
  mode: string
  snr: number
  heardAt: number
  sender: string
  senderGrid: string
  senderContinent: Continent
  receiver: string
  receiverGrid: string
}

export type StrongestSignal = {
  callsign: string
  grid: string
  snr: number
}

export type ActivityCell = {
  band: string
  continent: Continent
  reports: number
  stations: number
  strongest: StrongestSignal
  lastHeard: string
}

/* receivers within this distance of the station's grid count as near us */
export type ReceiverArea = {
  grid: string
  radiusMiles: number
}

export type BandActivity = {
  source: string
  updated: string
  windowMinutes: number
  /* null until the station has a grid, which says where "near us" is */
  area: ReceiverArea | null
  feed: FeedState | null
  listeningSince: string | null
  receivers: number
  bands: string[]
  continents: Continent[]
  cells: ActivityCell[]
}

export const BANDS = [
  '160m',
  '80m',
  '60m',
  '40m',
  '30m',
  '20m',
  '17m',
  '15m',
  '12m',
  '10m',
  '6m'
]

export const CONTINENTS: Continent[] = ['NA', 'SA', 'EU', 'AF', 'AS', 'OC']

export const CONTINENT_NAMES: Record<Continent, string> = {
  NA: 'North America',
  SA: 'South America',
  EU: 'Europe',
  AF: 'Africa',
  AS: 'Asia',
  OC: 'Oceania'
}
