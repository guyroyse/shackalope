import './styles.css'

import {
  AppBridge,
  PostMessageTransport
} from '@modelcontextprotocol/ext-apps/app-bridge'
import {
  Client,
  StreamableHTTPClientTransport
} from '@modelcontextprotocol/client'

import { SCENARIOS } from './scenarios'

type Theme = 'light' | 'dark'
type Width = 'wide' | 'narrow'

type Settings = {
  view: string
  theme: Theme
  width: Width
}

const HOST_INFO = { name: 'shackalope-preview', version: '1.0.0' }
const HOST_CAPABILITIES = {
  serverTools: {},
  serverResources: {},
  updateModelContext: { text: {} },
  logging: {}
}

const WIDTHS: Record<Width, number> = { wide: 720, narrow: 375 }
const ARGUMENTS_KEY_PREFIX = 'preview-arguments:'

const frame = document.querySelector<HTMLIFrameElement>('.view')!
const argumentsBox = control<HTMLTextAreaElement>('arguments')
const settings = readSettings()

let bridge: AppBridge | null = null

setUpControls()
applyChrome()

const client = await connectClient()
await loadView()

/* the bridge is the host side of the MCP Apps protocol, the part Claude
   Desktop plays; with a client it forwards the view's tool calls and
   resource reads to the real server */
async function loadView() {
  await bridge?.close()
  showArguments()

  bridge = new AppBridge(client, HOST_INFO, HOST_CAPABILITIES, {
    hostContext: { theme: settings.theme }
  })

  bridge.oninitialized = () => void runTool()

  bridge.onsizechange = ({ width, height }) => {
    log(`view resized itself to ${width} × ${height}`)
    if (height) frame.style.height = `${height}px`
  }

  bridge.onupdatemodelcontext = async ({ content }) => {
    log(`view told the model: ${textOf(content)}`)
    return {}
  }

  const transport = new PostMessageTransport(
    frame.contentWindow!,
    frame.contentWindow!
  )

  await bridge.connect(transport)
  frame.src = `/${settings.view}/app/index.html`
}

/* calls the view's tool with whatever is in the arguments box, then hands
   the result to the view as a host would */
async function runTool() {
  if (!client || !bridge) return

  const { tool } = SCENARIOS[settings.view]
  const toolArguments = readArguments()
  if (!toolArguments) return

  saveArguments()
  log(`calling ${tool} with ${JSON.stringify(toolArguments)}`)

  try {
    await bridge.sendToolInput({ arguments: toolArguments })
    const result = await client.callTool({
      name: tool,
      arguments: toolArguments
    })
    await bridge.sendToolResult(result)

    const level = result.isError ? 'error' : 'info'
    log(`${tool} returned: ${textOf(result.content)}`, level)
  } catch (error) {
    log(`${tool} failed: ${(error as Error).message}`, 'error')
  }
}

function readArguments(): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(argumentsBox.value || '{}')
    const isObject =
      typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)

    if (!isObject) throw new Error('arguments must be a JSON object')

    argumentsBox.removeAttribute('aria-invalid')
    return parsed as Record<string, unknown>
  } catch (error) {
    argumentsBox.setAttribute('aria-invalid', 'true')
    log(`can't run: ${(error as Error).message}`, 'error')
    return null
  }
}

function showArguments() {
  const { tool, arguments: sample } = SCENARIOS[settings.view]
  document.querySelector('[data-slot="tool-name"]')!.textContent = tool
  argumentsBox.value = loadSavedArguments() ?? formatArguments(sample)
  argumentsBox.removeAttribute('aria-invalid')
}

function resetArguments() {
  argumentsBox.value = formatArguments(SCENARIOS[settings.view].arguments)
  argumentsBox.removeAttribute('aria-invalid')
  forgetSavedArguments()
}

/* edits are remembered per view; storage can be unavailable, and that's fine */
function loadSavedArguments(): string | null {
  try {
    return localStorage.getItem(`${ARGUMENTS_KEY_PREFIX}${settings.view}`)
  } catch {
    return null
  }
}

function saveArguments() {
  try {
    const key = `${ARGUMENTS_KEY_PREFIX}${settings.view}`
    localStorage.setItem(key, argumentsBox.value)
  } catch {
    /* not remembered this time */
  }
}

function forgetSavedArguments() {
  try {
    localStorage.removeItem(`${ARGUMENTS_KEY_PREFIX}${settings.view}`)
  } catch {
    /* nothing to forget */
  }
}

function formatArguments(toolArguments: Record<string, unknown>): string {
  return JSON.stringify(toolArguments, null, 2)
}

async function connectClient(): Promise<Client | null> {
  try {
    const client = new Client(HOST_INFO)
    const url = new URL('/mcp', location.href)
    await client.connect(new StreamableHTTPClientTransport(url))
    log('connected to the MCP server')
    return client
  } catch (error) {
    log(
      `couldn't reach the MCP server; is it running (npm run dev)? ${(error as Error).message}`,
      'error'
    )
    return null
  }
}

function setUpControls() {
  const viewSelect = control<HTMLSelectElement>('view')
  for (const name of Object.keys(SCENARIOS)) viewSelect.add(new Option(name))

  viewSelect.value = settings.view
  control<HTMLSelectElement>('theme').value = settings.theme
  control<HTMLSelectElement>('width').value = settings.width

  viewSelect.addEventListener('change', () => {
    settings.view = viewSelect.value
    saveSettings()
    void loadView()
  })

  control<HTMLSelectElement>('theme').addEventListener('change', event => {
    settings.theme = (event.target as HTMLSelectElement).value as Theme
    saveSettings()
    applyChrome()
    bridge?.setHostContext({ theme: settings.theme })
  })

  control<HTMLSelectElement>('width').addEventListener('change', event => {
    settings.width = (event.target as HTMLSelectElement).value as Width
    saveSettings()
    applyChrome()
  })

  control('run').addEventListener('click', () => void runTool())
  control('reset').addEventListener('click', resetArguments)

  argumentsBox.addEventListener('keydown', event => {
    const runShortcut =
      event.key === 'Enter' && (event.ctrlKey || event.metaKey)
    if (!runShortcut) return

    event.preventDefault()
    void runTool()
  })
}

function applyChrome() {
  document.documentElement.dataset.theme = settings.theme
  frame.style.width = `${WIDTHS[settings.width]}px`
}

/* kept in the URL, so a reload (or a hot reload) comes back the same */
function readSettings(): Settings {
  const query = new URLSearchParams(location.search)
  const view = query.get('view') ?? ''

  return {
    view: view in SCENARIOS ? view : Object.keys(SCENARIOS)[0],
    theme: query.get('theme') === 'dark' ? 'dark' : 'light',
    width: query.get('width') === 'narrow' ? 'narrow' : 'wide'
  }
}

function saveSettings() {
  const query = new URLSearchParams(settings)
  history.replaceState(null, '', `?${query}`)
}

function log(message: string, level: 'info' | 'error' = 'info') {
  const item = document.createElement('li')
  const time = document.createElement('time')

  time.textContent = new Date().toLocaleTimeString()
  item.dataset.level = level
  item.append(time, message)

  document.querySelector('[data-slot="log"]')!.prepend(item)
}

function textOf(content: unknown): string {
  if (!Array.isArray(content)) return ''
  return content
    .filter(block => block?.type === 'text')
    .map(block => block.text)
    .join(' ')
}

function control<T extends HTMLElement = HTMLElement>(name: string): T {
  return document.querySelector<T>(`[data-control="${name}"]`)!
}
