import type { McpServer } from '@modelcontextprotocol/server'

import { BAND_ACTIVITY_URI } from '@mcp/uris'
import type { Services } from '@services/create-services'
import { summarizeBandActivity } from '@services/band-activity/summary'

const MIME_TYPE = 'application/json'

const TOOL_DESCRIPTION = `Gets live band activity near this station, without
showing anything to the user: which bands are carrying signals from which
continents right now, as heard by PSKReporter receivers within 250 miles of
the station's grid over the last 15 minutes. Counts stations per band and
continent, with the strongest signal in each. This is observed propagation,
mostly FT8 and other digital modes, so a quiet band may be closed or just
unused. The first call starts listening, and the picture fills in over the
next 15 minutes. Needs the station's grid (see set_station). To show the
activity to the user, use show_band_activity instead.`

export function registerBandActivityQuery(
  server: McpServer,
  services: Services
) {
  server.registerResource(
    'band-activity',
    BAND_ACTIVITY_URI,
    {
      title: 'Band Activity',
      description: 'Live band activity by continent near this station',
      mimeType: MIME_TYPE
    },
    async uri => {
      const activity = await services.bandActivity.snapshot()
      return {
        contents: [
          { uri: uri.href, mimeType: MIME_TYPE, text: JSON.stringify(activity) }
        ]
      }
    }
  )

  server.registerTool(
    'get_band_activity',
    {
      title: 'Get Band Activity',
      description: TOOL_DESCRIPTION,
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async () => {
      const activity = await services.bandActivity.snapshot()
      return {
        content: [
          { type: 'text', text: summarizeBandActivity(activity) },
          {
            type: 'resource_link',
            uri: BAND_ACTIVITY_URI,
            name: 'band-activity',
            mimeType: MIME_TYPE
          }
        ],
        structuredContent: activity
      }
    }
  )
}
