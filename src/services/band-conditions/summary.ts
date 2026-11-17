import type { BandConditions } from './model'

export function summarizeBandConditions(conditions: BandConditions): string {
  const { source, updated, solar, geomagneticField, signalNoise, hf, vhf } =
    conditions

  const indices = [
    `SFI ${show(solar.solarFlux)}`,
    `SN ${show(solar.sunspots)}`,
    `A ${show(solar.aIndex)}`,
    `K ${show(solar.kIndex)}`,
    `X-ray ${show(solar.xray)}`,
    `solar wind ${show(solar.solarWind)} km/s`,
    `Bz ${show(solar.magneticField)} nT`
  ]

  const bands = hf.map(
    ({ bands, day, night }) => `${bands}: day ${day}, night ${night}`
  )

  const vhfLines = vhf.map(
    ({ phenomenon, location, status }) =>
      `${phenomenon} (${location}): ${status}`
  )

  return [
    `Band conditions from ${source}, updated ${show(updated)}`,
    indices.join(', '),
    `Geomagnetic field: ${show(geomagneticField)}; noise: ${show(signalNoise)}`,
    '',
    'HF:',
    ...bands,
    '',
    'VHF:',
    ...vhfLines
  ].join('\n')
}

function show(value: string | number | null): string {
  return value === null ? 'n/a' : String(value)
}
