import './styles.css'

import { BAND_CONDITIONS_URI, SOLAR_IMAGE_PREFIX } from '@mcp/uris'
import { isBandConditions } from '@mcp/views/shared/guards'
import { connectViewApp, createViewApp } from '@mcp/views/shared/view-app'
import { summarizeBandConditions } from '@services/band-conditions/summary'

import {
  renderBandConditions,
  renderSunPicker,
  setRefreshing,
  showSunImage,
  slot
} from './render'
import type { SunView } from './render'

const panel = document.querySelector<HTMLElement>('.panel')!
const app = createViewApp('band-conditions')

app.addEventListener('toolresult', ({ structuredContent, isError }) => {
  if (!isError && isBandConditions(structuredContent))
    renderBandConditions(panel, structuredContent)
})

slot(panel, 'refresh').addEventListener('click', () => void refresh())

await connectViewApp(app)
await loadSunViews()

/* read the resource ourselves, then tell the model what the user now sees */
async function refresh() {
  setRefreshing(panel, true)

  try {
    const { contents } = await app.readServerResource({
      uri: BAND_CONDITIONS_URI
    })
    const [content] = contents
    if (!content || !('text' in content)) return

    const conditions: unknown = JSON.parse(content.text)
    if (!isBandConditions(conditions)) return

    renderBandConditions(panel, conditions)
    await app.updateModelContext({
      content: [{ type: 'text', text: summarizeBandConditions(conditions) }]
    })
  } catch (error) {
    console.error('refreshing band conditions failed', error)
  } finally {
    setRefreshing(panel, false)
  }
}

async function loadSunViews() {
  try {
    const { resources } = await app.listServerResources()

    const views: SunView[] = resources
      .filter(resource => resource.uri.startsWith(SOLAR_IMAGE_PREFIX))
      .map(({ uri, name, title, description }) => ({
        uri,
        title: title ?? name,
        description: description ?? ''
      }))

    renderSunPicker(panel, views, view => void loadSunImage(view))
    if (views.length > 0) await loadSunImage(views[0])
  } catch (error) {
    console.error('listing solar images failed', error)
  }
}

async function loadSunImage(view: SunView) {
  try {
    const { contents } = await app.readServerResource({ uri: view.uri })
    const [content] = contents

    const source =
      content && 'blob' in content
        ? `data:${content.mimeType ?? 'image/jpeg'};base64,${content.blob}`
        : null

    showSunImage(panel, view, source)
  } catch (error) {
    console.error(`loading ${view.uri} failed`, error)
    showSunImage(panel, view, null)
  }
}
