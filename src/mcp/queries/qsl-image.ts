import { ResourceTemplate } from '@modelcontextprotocol/server'
import type { McpServer } from '@modelcontextprotocol/server'

import { QSL_IMAGE_TEMPLATE, qslImageURI } from '@mcp/uris'
import type { Services } from '@services/create-services'

export function registerQSL_ImageQuery(server: McpServer, services: Services) {
  const template = new ResourceTemplate(QSL_IMAGE_TEMPLATE, {
    list: async () => {
      const images = await services.cardImages.list()
      return {
        resources: images.map(({ name, mimeType }) => ({
          uri: qslImageURI(name),
          name: `qsl-image-${name}`,
          title: name,
          description: `QSL card background "${name}"`,
          mimeType
        }))
      }
    },
    complete: {
      name: async value => {
        const images = await services.cardImages.list()
        return images
          .map(image => image.name)
          .filter(name => name.startsWith(value))
      }
    }
  })

  server.registerResource(
    'qsl-image',
    template,
    {
      title: 'QSL Card Background',
      description: 'A saved background image for QSL cards'
    },
    async (uri, { name }) => {
      const { data, mimeType } = await services.cardImages.read(
        firstValue(name)
      )
      return { contents: [{ uri: uri.href, mimeType, blob: data }] }
    }
  )

  /* the model gets names to pass to show_qsl_card, not the images themselves */
  server.registerTool(
    'list_qsl_images',
    {
      title: 'List QSL Card Images',
      description: 'Lists the saved QSL card background images',
      annotations: { readOnlyHint: true }
    },
    async () => {
      const images = (await services.cardImages.list()).map(({ name }) => ({
        name,
        uri: qslImageURI(name)
      }))

      const names = images.map(image => image.name).join(', ')
      const text = names
        ? `Saved QSL card images: ${names}`
        : 'No QSL card images saved yet'

      return {
        content: [{ type: 'text', text }],
        structuredContent: { images }
      }
    }
  )
}

function firstValue(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value
}
