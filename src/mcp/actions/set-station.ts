import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import { STATION_URI } from '@mcp/uris'
import type { Services } from '@services/create-services'
import { describeStation } from '@services/station/summary'

const DESCRIPTION = `Updates this station's details. Only the fields given
are changed; pass an empty string to clear one.`

export function registerSetStationAction(
  server: McpServer,
  services: Services
) {
  server.registerTool(
    'set_station',
    {
      title: 'Set Station',
      description: DESCRIPTION,
      inputSchema: z.object({
        callsign: z.string().optional().describe("The operator's callsign"),
        operatorName: z.string().optional().describe("The operator's name"),
        qth: z
          .string()
          .optional()
          .describe('Station location, e.g. "Columbus, OH"'),
        grid: z
          .string()
          .optional()
          .describe('Maidenhead grid locator, e.g. EN80 or EN80ab')
      }),
      annotations: { idempotentHint: true }
    },
    async update => {
      const station = await services.station.update(update)
      return {
        content: [
          { type: 'text', text: describeStation(station) },
          { type: 'resource_link', uri: STATION_URI, name: 'station' }
        ],
        structuredContent: station
      }
    }
  )
}
