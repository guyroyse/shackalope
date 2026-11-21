import type { McpServer } from '@modelcontextprotocol/server'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'

import { PROPAGATION_VIEW_URI } from '@mcp/uris'
import { registerViewResource } from '@mcp/views/view-resource'
import { fetchBandConditions } from '@services/band-conditions/hamqsl'
import type { Services } from '@services/create-services'
import type { Propagation } from '@services/propagation/model'
import { summarizePropagation } from '@services/propagation/summary'

const DESCRIPTION = `Shows the user a compact propagation panel: the key
solar-terrestrial readouts, highlighted when they're disruptive, the HF band
ratings from N0NBH's HamQSL, and a live strip of how many stations
PSKReporter receivers near this station are hearing on each band. The
activity strip keeps itself up to date and needs the station's grid. Also
returns the data, so you can discuss it. For the full detail, use
show_band_conditions or show_band_activity instead.`

export function registerPropagationView(server: McpServer, services: Services) {
  registerAppTool(
    server,
    'show_propagation',
    {
      title: 'Show Propagation',
      description: DESCRIPTION,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { ui: { resourceUri: PROPAGATION_VIEW_URI } }
    },
    async () => {
      const [conditions, activity] = await Promise.all([
        fetchBandConditions(),
        services.bandActivity.snapshot()
      ])
      const propagation: Propagation = { conditions, activity }

      return {
        content: [{ type: 'text', text: summarizePropagation(propagation) }],
        structuredContent: propagation
      }
    }
  )

  registerViewResource(server, {
    name: 'propagation',
    uri: PROPAGATION_VIEW_URI,
    title: 'Propagation View',
    description: 'Solar readouts, HF ratings, and live activity by band'
  })
}
