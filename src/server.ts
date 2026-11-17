import { serve } from '@hono/node-server'

import { createServices } from './services/create-services'
import { Vault } from './stores/vault'
import { resolveVaultDirectory } from './stores/vault-location'
import { buildHttpApp, MCP_PATH } from './http/http-app'

const PORT = Number(process.env.PORT ?? 3000)

const vault = new Vault(resolveVaultDirectory())
const services = createServices(vault)

serve({ fetch: buildHttpApp(services).fetch, port: PORT }, () => {
  console.log(`vault: ${vault.root}`)
  console.log(`MCP server listening on http://localhost:${PORT}${MCP_PATH}`)
})
