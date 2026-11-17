import './styles.css'

import type { QSL_Card } from '@services/qsl-card/model'
import { connectViewApp, createViewApp } from '@mcp/views/shared/view-app'

import { hidePhoto, renderQSL_Card, showPhoto } from './render'

const card = document.querySelector<HTMLElement>('.qsl')!
const app = createViewApp('qsl-card')

app.addEventListener('toolresult', ({ structuredContent, isError }) => {
  if (isError || !isQSL_Card(structuredContent)) return

  renderQSL_Card(card, structuredContent)

  if (structuredContent.image) {
    void loadPhoto(structuredContent.image)
  } else {
    hidePhoto(card)
  }
})

await connectViewApp(app)

async function loadPhoto({ name, uri }: { name: string; uri: string }) {
  try {
    const { contents } = await app.readServerResource({ uri })
    const [content] = contents
    if (!content || !('blob' in content)) return

    showPhoto(card, `data:${content.mimeType};base64,${content.blob}`, name)
  } catch (error) {
    /* the card still works without its photo */
    console.error(`couldn't load QSL card image "${name}"`, error)
  }
}

function isQSL_Card(value: unknown): value is QSL_Card {
  if (typeof value !== 'object' || value === null) return false
  const { station, contact } = value as Record<string, unknown>
  return typeof station === 'object' && typeof contact === 'object'
}
