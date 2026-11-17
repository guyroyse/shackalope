import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { McpServer } from '@modelcontextprotocol/server'
import {
  registerAppResource,
  RESOURCE_MIME_TYPE
} from '@modelcontextprotocol/ext-apps/server'

type ViewResource = {
  name: string
  uri: string
  title: string
  description: string
}

/* the server is bundled into dist/, right beside the built views */
const VIEW_DIRECTORY = join(import.meta.dirname, 'views')

export function registerViewResource(
  server: McpServer,
  { name, uri, title, description }: ViewResource
) {
  registerAppResource(
    server,
    title,
    uri,
    { description, mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        { uri, mimeType: RESOURCE_MIME_TYPE, text: await loadView(name) }
      ]
    })
  )
}

/* Vite mirrors the source layout: src/mcp/views/<name>/app/index.html */
async function loadView(name: string): Promise<string> {
  return readFile(join(VIEW_DIRECTORY, name, 'app', 'index.html'), 'utf8')
}
