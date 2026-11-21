import type { BandActivity } from '@services/band-activity/model'
import type { BandConditions } from '@services/band-conditions/model'

/* the forecast and what's actually being heard, side by side */
export type Propagation = {
  conditions: BandConditions
  activity: BandActivity
}
