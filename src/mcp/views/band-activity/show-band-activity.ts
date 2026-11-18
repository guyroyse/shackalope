import type { McpServer } from '@modelcontextprotocol/server'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'

import { BAND_ACTIVITY_VIEW_URI } from '@mcp/uris'
import { registerViewResource } from '@mcp/views/view-resource'
import type { Services } from '@services/create-services'
import { summarizeBandActivity } from '@services/band-activity/summary'

const DESCRIPTION = `Shows the user a live grid of band activity near this
station: bands down the side, continents across the top, each cell shaded by
how many stations on that continent PSKReporter receivers within 250 miles
of the station's grid have heard on that band in the last 15 minutes. The
view keeps itself up to date. Also returns the data, so you can discuss it.
Use get_band_activity if you only need the data.`

export function registerBandActivityView(
  server: McpServer,
  services: Services
) {
  registerAppTool(
    server,
    'show_band_activity',
    {
      title: 'Show Band Activity',
      description: DESCRIPTION,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { ui: { resourceUri: BAND_ACTIVITY_VIEW_URI } }
    },
    async () => {
      const activity = await services.bandActivity.snapshot()
      return {
        content: [{ type: 'text', text: summarizeBandActivity(activity) }],
        structuredContent: activity
      }
    }
  )

  registerViewResource(server, {
    name: 'band-activity',
    uri: BAND_ACTIVITY_VIEW_URI,
    title: 'Band Activity View',
    description: 'A live band-by-continent grid of signals heard nearby'
  })
}
