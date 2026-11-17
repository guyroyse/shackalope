import { Hono } from 'hono'
import { createMcpHandler } from '@modelcontextprotocol/server'

import { buildMcpServer } from '@mcp/mcp-server'
import type { Services } from '@services/create-services'

import { requireLocalHost, requireLocalOrigin } from './localhost'

export const MCP_PATH = '/mcp'

export function buildHttpApp(services: Services): Hono {
  const mcpHandler = createMcpHandler(() => buildMcpServer(services), {
    onerror: error => console.error(error)
  })

  const app = new Hono()

  app.use(requireLocalHost)
  app.use(MCP_PATH, requireLocalOrigin)
  app.all(MCP_PATH, context => mcpHandler.fetch(context.req.raw))

  return app
}
