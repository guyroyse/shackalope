import { ResourceTemplate } from '@modelcontextprotocol/server'
import type { McpServer } from '@modelcontextprotocol/server'

import { SOLAR_IMAGE_TEMPLATE, solarImageURI } from '@mcp/uris'
import { fetchSolarImage, SOLAR_IMAGES } from '@services/solar-images/sdo'

const MIME_TYPE = 'image/jpeg'

/* view-only: the model has no use for the image bytes, so there's no tool */
export function registerSolarImageQuery(server: McpServer) {
  const template = new ResourceTemplate(SOLAR_IMAGE_TEMPLATE, {
    list: async () => ({
      resources: SOLAR_IMAGES.map(({ id, title, description }) => ({
        uri: solarImageURI(id),
        name: `solar-image-${id}`,
        title,
        description,
        mimeType: MIME_TYPE
      }))
    }),
    complete: {
      id: value =>
        SOLAR_IMAGES.map(image => image.id).filter(id => id.startsWith(value))
    }
  })

  server.registerResource(
    'solar-image',
    template,
    {
      title: 'Solar Image',
      description:
        "The latest image of the sun from NASA's Solar Dynamics Observatory",
      mimeType: MIME_TYPE
    },
    async (uri, { id }) => {
      const bytes = await fetchSolarImage(firstValue(id))
      return {
        contents: [
          { uri: uri.href, mimeType: MIME_TYPE, blob: bytes.toString('base64') }
        ]
      }
    }
  )
}

function firstValue(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value
}
