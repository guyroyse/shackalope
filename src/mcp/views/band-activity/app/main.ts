import './styles.css'

import { BAND_ACTIVITY_URI } from '@mcp/uris'
import { connectViewApp, createViewApp } from '@mcp/views/shared/view-app'
import type { BandActivity } from '@services/band-activity/model'
import { summarizeBandActivity } from '@services/band-activity/summary'

import { renderBandActivity, renderLegend, showDetail, slot } from './render'

/* the server can't push, so the view asks; the server keeps listening to
   PSKReporter between asks and answers from what it has gathered */
const POLL_MS = 10_000

/* the model hears about changes at most this often, and only when the set
   of bands and continents being heard has changed */
const MODEL_UPDATE_MS = 60_000

const panel = document.querySelector<HTMLElement>('.panel')!
const app = createViewApp('band-activity')

let latest: BandActivity | null = null
let selected: string | null = null
let toldModel = { at: Date.now(), heard: '' }

app.addEventListener('toolresult', ({ structuredContent, isError }) => {
  if (isError || !isBandActivity(structuredContent)) return

  toldModel = { at: Date.now(), heard: heardSignature(structuredContent) }
  show(structuredContent)
})

listenForSelection()
renderLegend(panel)

await connectViewApp(app)
setInterval(() => void poll(), POLL_MS)

async function poll() {
  if (document.hidden) return

  try {
    const { contents } = await app.readServerResource({
      uri: BAND_ACTIVITY_URI
    })
    const [content] = contents
    if (!content || !('text' in content)) return

    const activity: unknown = JSON.parse(content.text)
    if (!isBandActivity(activity)) return

    show(activity)
    await tellModelIfChanged(activity)
  } catch (error) {
    console.error('polling band activity failed', error)
  }
}

/* rebuilding the grid would drop keyboard focus, so put it back */
function show(activity: BandActivity) {
  const focused = (document.activeElement as HTMLElement | null)?.dataset.key

  latest = activity
  renderBandActivity(panel, activity, selected)

  if (focused)
    panel.querySelector<HTMLElement>(`[data-key="${focused}"]`)?.focus()
}

async function tellModelIfChanged(activity: BandActivity) {
  const heard = heardSignature(activity)
  const now = Date.now()

  if (heard === toldModel.heard || now - toldModel.at < MODEL_UPDATE_MS) return

  toldModel = { at: now, heard }
  await app.updateModelContext({
    content: [{ type: 'text', text: summarizeBandActivity(activity) }]
  })
}

/* the cells are rebuilt on every poll, so listen on the table, not them */
function listenForSelection() {
  const rows = slot(panel, 'rows')

  const select = (event: Event) => {
    const target = event.target as HTMLElement
    const key = target.closest<HTMLElement>('[data-key]')?.dataset.key
    if (!key || key === selected) return

    selected = key
    if (latest) showDetail(panel, latest, selected)
  }

  rows.addEventListener('pointerover', select)
  rows.addEventListener('focusin', select)
  rows.addEventListener('click', select)
}

function heardSignature({ cells }: BandActivity): string {
  return cells
    .map(({ band, continent }) => `${band} ${continent}`)
    .sort()
    .join()
}

function isBandActivity(value: unknown): value is BandActivity {
  if (typeof value !== 'object' || value === null) return false
  const { bands, continents, cells } = value as Record<string, unknown>
  return (
    Array.isArray(bands) && Array.isArray(continents) && Array.isArray(cells)
  )
}
