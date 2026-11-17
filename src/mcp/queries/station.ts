import type { McpServer } from '@modelcontextprotocol/server'

import { STATION_URI } from '@mcp/uris'
import type { Services } from '@services/create-services'
import { describeStation } from '@services/station/summary'

const MIME_TYPE = 'application/json'

const TOOL_DESCRIPTION = `Gets this station's details: the operator's
callsign, name, QTH, and Maidenhead grid. These appear on QSL cards.`

export function registerStationQuery(server: McpServer, services: Services) {
  server.registerResource(
    'station',
    STATION_URI,
    {
      title: 'Station',
      description: "This station's callsign, operator name, QTH, and grid",
      mimeType: MIME_TYPE
    },
    async uri => {
      const station = await services.station.get()
      return {
        contents: [
          { uri: uri.href, mimeType: MIME_TYPE, text: JSON.stringify(station) }
        ]
      }
    }
  )

  server.registerTool(
    'get_station',
    {
      title: 'Get Station',
      description: TOOL_DESCRIPTION,
      annotations: { readOnlyHint: true }
    },
    async () => {
      const station = await services.station.get()
      return {
        content: [
          { type: 'text', text: describeStation(station) },
          {
            type: 'resource_link',
            uri: STATION_URI,
            name: 'station',
            mimeType: MIME_TYPE
          }
        ],
        structuredContent: station
      }
    }
  )
}
