import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import { qslImageURI } from '@mcp/uris'
import type { Services } from '@services/create-services'

const DESCRIPTION = `Saves a background image for QSL cards (PNG, JPEG,
GIF, or WebP, up to 5 MB), downloaded from a URL or given as base64 data.
Saving under an existing name replaces that image.`

export function registerSaveQSL_ImageAction(
  server: McpServer,
  services: Services
) {
  server.registerTool(
    'save_qsl_image',
    {
      title: 'Save QSL Card Image',
      description: DESCRIPTION,
      inputSchema: z
        .object({
          name: z.string().describe('Name to save it under, e.g. "shack"'),
          url: z.string().optional().describe('http(s) URL of the image'),
          data: z.string().optional().describe('Base64-encoded image data')
        })
        .refine(
          ({ url, data }) => (url === undefined) !== (data === undefined),
          {
            message: 'provide exactly one of url or data'
          }
        )
    },
    async ({ name, url, data }) => {
      const source = url !== undefined ? { url } : { data: data! }
      const image = await services.cardImages.save(name, source)
      const uri = qslImageURI(image.name)

      return {
        content: [
          { type: 'text', text: `Saved QSL card image "${image.name}"` },
          {
            type: 'resource_link',
            uri,
            name: image.name,
            mimeType: image.mimeType
          }
        ],
        structuredContent: { name: image.name, uri }
      }
    }
  )
}
