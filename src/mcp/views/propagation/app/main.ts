import './styles.css'

import { BAND_ACTIVITY_URI, BAND_CONDITIONS_URI } from '@mcp/uris'
import { isBandActivity, isBandConditions } from '@mcp/views/shared/guards'
import { connectViewApp, createViewApp } from '@mcp/views/shared/view-app'
import type { BandActivity } from '@services/band-activity/model'
import type { BandConditions } from '@services/band-conditions/model'
import type { Propagation } from '@services/propagation/model'
import { summarizePropagation } from '@services/propagation/summary'

import {
  activitySignature,
  renderActivity,
  renderConditions,
  setRefreshing,
  slot
} from './render'

/* the server can't push, so the view asks; asking also keeps the server
   listening to PSKReporter. Conditions change hourly, so only on Refresh */
const POLL_MS = 10_000

/* the model hears about changes at most this often, and only when a band
   has moved to a different tier */
const MODEL_UPDATE_MS = 60_000

const panel = document.querySelector<HTMLElement>('.panel')!
const app = createViewApp('propagation')

let conditions: BandConditions | null = null
let activity: BandActivity | null = null
let toldModel = { at: Date.now(), signature: '' }

app.addEventListener('toolresult', ({ structuredContent, isError }) => {
  if (isError || !isPropagation(structuredContent)) return

  showConditions(structuredContent.conditions)
  showActivity(structuredContent.activity)
  toldModel = {
    at: Date.now(),
    signature: activitySignature(structuredContent.activity)
  }
})

slot(panel, 'refresh').addEventListener('click', () => void refresh())

await connectViewApp(app)
setInterval(() => void poll(), POLL_MS)

async function refresh() {
  setRefreshing(panel, true)

  try {
    const [freshConditions, freshActivity] = await Promise.all([
      readJSON(BAND_CONDITIONS_URI),
      readJSON(BAND_ACTIVITY_URI)
    ])

    if (isBandConditions(freshConditions)) showConditions(freshConditions)
    if (isBandActivity(freshActivity)) showActivity(freshActivity)
    await tellModel()
  } catch (error) {
    console.error('refreshing propagation failed', error)
  } finally {
    setRefreshing(panel, false)
  }
}

async function poll() {
  if (document.hidden) return

  try {
    const fresh = await readJSON(BAND_ACTIVITY_URI)
    if (!isBandActivity(fresh)) return

    showActivity(fresh)
    await tellModelIfChanged()
  } catch (error) {
    console.error('polling band activity failed', error)
  }
}

function showConditions(fresh: BandConditions) {
  conditions = fresh
  renderConditions(panel, fresh)
}

function showActivity(fresh: BandActivity) {
  activity = fresh
  renderActivity(panel, fresh)
}

async function tellModelIfChanged() {
  if (!activity) return

  const signature = activitySignature(activity)
  const changed = signature !== toldModel.signature
  if (!changed || Date.now() - toldModel.at < MODEL_UPDATE_MS) return

  await tellModel()
}

async function tellModel() {
  if (!conditions || !activity) return

  toldModel = { at: Date.now(), signature: activitySignature(activity) }
  await app.updateModelContext({
    content: [
      { type: 'text', text: summarizePropagation({ conditions, activity }) }
    ]
  })
}

async function readJSON(uri: string): Promise<unknown> {
  const { contents } = await app.readServerResource({ uri })
  const [content] = contents
  return content && 'text' in content ? JSON.parse(content.text) : null
}

function isPropagation(value: unknown): value is Propagation {
  if (typeof value !== 'object' || value === null) return false
  const { conditions, activity } = value as Record<string, unknown>
  return isBandConditions(conditions) && isBandActivity(activity)
}
