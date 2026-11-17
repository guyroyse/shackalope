import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import { toImageName } from '@services/qsl-card/card-images'
import type { Services } from '@services/create-services'

export function registerDeleteQSL_ImageAction(
  server: McpServer,
  services: Services
) {
  server.registerTool(
    'delete_qsl_image',
    {
      title: 'Delete QSL Card Image',
      description: 'Deletes a saved QSL card background image',
      inputSchema: z.object({
        name: z.string().describe('Name of the image to delete')
      }),
      annotations: { destructiveHint: true, idempotentHint: true }
    },
    async ({ name }) => {
      const deleted = await services.cardImages.delete(name)
      const text = deleted
        ? `Deleted QSL card image "${toImageName(name)}"`
        : `No QSL card image named "${toImageName(name)}"`

      return {
        content: [{ type: 'text', text }],
        structuredContent: { deleted }
      }
    }
  )
}
