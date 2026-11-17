import type { Station } from '@services/station/model'

export type Contact = {
  callsign: string
  operatorName: string | null
  date: string
  time: string
  frequency: number | null
  band: string | null
  mode: string
  rst: string | null
}

export type ContactDetails = {
  callsign: string
  operatorName?: string
  date?: string
  time?: string
  frequency?: number
  band?: string
  mode: string
  rst?: string
}

export type QSL_Card = {
  station: Station
  contact: Contact
  remarks: string | null
  image: { name: string; uri: string } | null
}
