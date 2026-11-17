export type BandRating = 'Good' | 'Fair' | 'Poor' | 'Unknown'

export type HF_BandCondition = {
  bands: string
  day: BandRating
  night: BandRating
}

export type VHF_Condition = {
  phenomenon: string
  location: string
  status: string
}

export type SolarIndices = {
  solarFlux: number | null
  sunspots: number | null
  aIndex: number | null
  kIndex: number | null
  xray: string | null
  solarWind: number | null
  magneticField: number | null
  protonFlux: number | null
  electronFlux: number | null
  aurora: number | null
}

export type BandConditions = {
  source: string
  updated: string | null
  solar: SolarIndices
  geomagneticField: string | null
  signalNoise: string | null
  hf: HF_BandCondition[]
  vhf: VHF_Condition[]
}
