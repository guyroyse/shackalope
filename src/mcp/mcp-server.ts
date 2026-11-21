import { McpServer } from '@modelcontextprotocol/server'

import type { Services } from '@services/create-services'

import { registerDeleteQSL_ImageAction } from './actions/delete-qsl-image'
import { registerSaveQSL_ImageAction } from './actions/save-qsl-image'
import { registerSetStationAction } from './actions/set-station'
import { registerBandActivityQuery } from './queries/band-activity'
import { registerBandConditionsQuery } from './queries/band-conditions'
import { registerQSL_ImageQuery } from './queries/qsl-image'
import { registerSolarImageQuery } from './queries/solar-image'
import { registerStationQuery } from './queries/station'
import { registerBandActivityView } from './views/band-activity/show-band-activity'
import { registerBandConditionsView } from './views/band-conditions/show-band-conditions'
import { registerPropagationView } from './views/propagation/show-propagation'
import { registerQSL_CardView } from './views/qsl-card/show-qsl-card'

export function buildMcpServer(services: Services): McpServer {
  const server = new McpServer({ name: 'shackalope', version: '1.0.0' })

  /* queries: read-only, each a resource with an optional tool for the model */
  registerBandConditionsQuery(server)
  registerBandActivityQuery(server, services)
  registerStationQuery(server, services)
  registerSolarImageQuery(server)
  registerQSL_ImageQuery(server, services)

  /* actions: tools with side effects */
  registerSetStationAction(server, services)
  registerSaveQSL_ImageAction(server, services)
  registerDeleteQSL_ImageAction(server, services)

  /* views: a show tool plus the UI resource it opens */
  registerBandConditionsView(server)
  registerBandActivityView(server, services)
  registerPropagationView(server, services)
  registerQSL_CardView(server, services)

  return server
}
