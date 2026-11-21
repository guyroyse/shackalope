import { summarizeBandActivity } from '@services/band-activity/summary'
import { summarizeBandConditions } from '@services/band-conditions/summary'

import type { Propagation } from './model'

export function summarizePropagation({
  conditions,
  activity
}: Propagation): string {
  return [
    summarizeBandConditions(conditions),
    '',
    summarizeBandActivity(activity)
  ].join('\n')
}
