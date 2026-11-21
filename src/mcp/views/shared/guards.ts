import type { BandActivity } from '@services/band-activity/model'
import type { BandConditions } from '@services/band-conditions/model'

/* data reaches a view as untyped JSON, from a tool result or a resource
   read, so check its shape before rendering it */

export function isBandConditions(value: unknown): value is BandConditions {
  if (typeof value !== 'object' || value === null) return false
  const { solar, hf, vhf } = value as Record<string, unknown>
  return typeof solar === 'object' && Array.isArray(hf) && Array.isArray(vhf)
}

export function isBandActivity(value: unknown): value is BandActivity {
  if (typeof value !== 'object' || value === null) return false
  const { bands, continents, cells } = value as Record<string, unknown>
  return (
    Array.isArray(bands) && Array.isArray(continents) && Array.isArray(cells)
  )
}
