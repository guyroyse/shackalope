import type { McpServer } from '@modelcontextprotocol/server'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'

import { QSL_CARD_VIEW_URI, qslImageURI } from '@mcp/uris'
import { registerViewResource } from '@mcp/views/view-resource'
import { buildContact } from '@services/qsl-card/contact'
import type { QSL_Card } from '@services/qsl-card/model'
import { describeCard } from '@services/qsl-card/summary'
import type { Services } from '@services/create-services'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const UTC_TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const DESCRIPTION = `Shows the user a QSL card from this station to another
station, confirming a contact (QSO). The sending station's details come from
get_station / set_station. Uses a saved background image: the one named, or
the only one saved, or a random one if several are saved.`

export function registerQSL_CardView(server: McpServer, services: Services) {
  registerAppTool(
    server,
    'show_qsl_card',
    {
      title: 'Show QSL Card',
      description: DESCRIPTION,
      inputSchema: z.object({
        callsign: z.string().describe('Callsign of the station worked'),
        operatorName: z
          .string()
          .optional()
          .describe("The other operator's name, if known"),
        date: z
          .string()
          .regex(ISO_DATE)
          .optional()
          .describe('UTC date of the contact, YYYY-MM-DD. Defaults to today.'),
        time: z
          .string()
          .regex(UTC_TIME)
          .optional()
          .describe('UTC time of the contact, HH:MM. Defaults to now.'),
        frequency: z
          .number()
          .positive()
          .optional()
          .describe('Frequency in MHz, e.g. 14.074'),
        band: z
          .string()
          .optional()
          .describe('Band, e.g. 20m. Worked out from frequency if omitted.'),
        mode: z.string().describe('Mode, e.g. SSB, CW, FT8, FM'),
        rst: z
          .string()
          .optional()
          .describe('Signal report sent. Defaults to 59 (phone) or 599 (CW).'),
        remarks: z
          .string()
          .optional()
          .describe('A short note for the card, e.g. "Tnx for the POTA QSO!"'),
        image: z
          .string()
          .optional()
          .describe(
            'Name of a saved background image. Omit to pick automatically.'
          )
      }),
      _meta: { ui: { resourceUri: QSL_CARD_VIEW_URI } }
    },
    async ({ remarks, image, ...details }) => {
      const cardImage = await services.cardImages.choose(image ?? null)

      const card: QSL_Card = {
        station: await services.station.get(),
        contact: buildContact(details),
        remarks: remarks ?? null,
        image: cardImage && {
          name: cardImage.name,
          uri: qslImageURI(cardImage.name)
        }
      }

      return {
        content: [{ type: 'text', text: describeCard(card) }],
        structuredContent: card
      }
    }
  )

  registerViewResource(server, {
    name: 'qsl-card',
    uri: QSL_CARD_VIEW_URI,
    title: 'QSL Card View',
    description: 'A QSL card confirming a contact'
  })
}
