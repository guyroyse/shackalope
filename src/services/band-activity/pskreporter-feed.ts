import { connect } from 'mqtt'
import type { MqttClient } from 'mqtt'

import { continentOf } from './dxcc-continents'
import type { FeedState, Reception } from './model'

type ReceptionListener = (reception: Reception) => void

/* the fields of a PSKReporter MQTT report that we use; sa is the sender's
   DXCC entity, and t is when the signal was heard, in Unix seconds */
type RawReport = {
  b?: unknown
  md?: unknown
  rp?: unknown
  t?: unknown
  sc?: unknown
  sl?: unknown
  sa?: unknown
  rc?: unknown
  rl?: unknown
}

const BROKER_URL = 'mqtts://mqtt.pskreporter.info:1884'
const RECONNECT_PERIOD_MS = 5_000
const CONNECT_TIMEOUT_MS = 15_000

/* PSKReporter's MQTT feed, filtered by the broker to receivers in the
   given grid squares; one connection, opened and closed as needed */
export class PSKReporterFeed {
  #client: MqttClient | null = null
  #state: FeedState = 'connecting'

  get open(): boolean {
    return this.#client !== null
  }

  get state(): FeedState | null {
    return this.#client ? this.#state : null
  }

  connect(squares: string[], onReception: ReceptionListener) {
    this.close()

    const client = connect(BROKER_URL, {
      reconnectPeriod: RECONNECT_PERIOD_MS,
      connectTimeout: CONNECT_TIMEOUT_MS
    })

    this.#client = client
    this.#state = 'connecting'

    client.on('connect', () => {
      this.#state = 'connected'
      client.subscribe(squares.map(receiverTopic))
    })

    client.on('reconnect', () => (this.#state = 'reconnecting'))
    client.on('error', error => console.error('PSKReporter feed:', error))

    client.on('message', (_topic, payload) => {
      const reception = parseReport(payload)
      if (reception) onReception(reception)
    })
  }

  close() {
    this.#client?.end(true)
    this.#client = null
  }
}

/* pskr/filter/v2/{band}/{mode}/{sender}/{receiver}/{sender square}
   /{receiver square}/{sender DXCC}/{receiver DXCC} */
function receiverTopic(square: string): string {
  return `pskr/filter/v2/+/+/+/+/+/${square}/+/+`
}

function parseReport(payload: Buffer): Reception | null {
  let report: RawReport

  try {
    report = JSON.parse(payload.toString()) as RawReport
  } catch {
    return null
  }

  const { b, md, rp, t, sc, sl, sa, rc, rl } = report

  if (typeof b !== 'string' || typeof sc !== 'string') return null
  if (typeof rc !== 'string' || typeof rl !== 'string') return null
  if (typeof sa !== 'number') return null
  if (typeof rp !== 'number' || typeof t !== 'number') return null

  const senderContinent = continentOf(sa)
  if (senderContinent === null) return null

  return {
    band: b,
    mode: typeof md === 'string' ? md : 'unknown',
    snr: rp,
    heardAt: t * 1000,
    sender: sc,
    senderGrid: typeof sl === 'string' ? sl : '',
    senderContinent,
    receiver: rc,
    receiverGrid: rl
  }
}
