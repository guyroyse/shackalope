import type { McpServer } from '@modelcontextprotocol/server'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'

import { BAND_CONDITIONS_VIEW_URI } from '@mcp/uris'
import { registerViewResource } from '@mcp/views/view-resource'
import { fetchBandConditions } from '@services/band-conditions/hamqsl'
import { summarizeBandConditions } from '@services/band-conditions/summary'

const DESCRIPTION = `Shows the user current HF and VHF band conditions,
solar-terrestrial data, and a live image of the sun, from N0NBH's HamQSL feed
and NASA's Solar Dynamics Observatory. Also returns the data, so you can
discuss it. Use get_band_conditions if you only need the data.`

export function registerBandConditionsView(server: McpServer) {
  registerAppTool(
    server,
    'show_band_conditions',
    {
      title: 'Show Band Conditions',
      description: DESCRIPTION,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { ui: { resourceUri: BAND_CONDITIONS_VIEW_URI } }
    },
    async () => {
      const conditions = await fetchBandConditions()
      return {
        content: [{ type: 'text', text: summarizeBandConditions(conditions) }],
        structuredContent: conditions
      }
    }
  )

  registerViewResource(server, {
    name: 'band-conditions',
    uri: BAND_CONDITIONS_VIEW_URI,
    title: 'Band Conditions View',
    description: 'HF band ratings, solar indices, and a live image of the sun'
  })
}
