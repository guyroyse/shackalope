import type { McpServer } from '@modelcontextprotocol/server'

import { BAND_CONDITIONS_URI } from '@mcp/uris'
import { fetchBandConditions } from '@services/band-conditions/hamqsl'
import { summarizeBandConditions } from '@services/band-conditions/summary'

const MIME_TYPE = 'application/json'

const TOOL_DESCRIPTION = `Gets current HF and VHF propagation conditions and
solar-terrestrial data (solar flux, sunspots, A and K indices, solar wind,
noise) from N0NBH's HamQSL feed, without showing anything to the user. HF
ratings are Good, Fair, or Poor for day and night across band pairs. Data
updates about hourly. To show the conditions to the user, use
show_band_conditions instead.`

export function registerBandConditionsQuery(server: McpServer) {
  server.registerResource(
    'band-conditions',
    BAND_CONDITIONS_URI,
    {
      title: 'Band Conditions',
      description:
        "Current HF and VHF band conditions from N0NBH's HamQSL feed",
      mimeType: MIME_TYPE
    },
    async uri => {
      const conditions = await fetchBandConditions()
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: MIME_TYPE,
            text: JSON.stringify(conditions)
          }
        ]
      }
    }
  )

  server.registerTool(
    'get_band_conditions',
    {
      title: 'Get Band Conditions',
      description: TOOL_DESCRIPTION,
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async () => {
      const conditions = await fetchBandConditions()
      return {
        content: [
          { type: 'text', text: summarizeBandConditions(conditions) },
          {
            type: 'resource_link',
            uri: BAND_CONDITIONS_URI,
            name: 'band-conditions',
            mimeType: MIME_TYPE
          }
        ],
        structuredContent: conditions
      }
    }
  )
}
