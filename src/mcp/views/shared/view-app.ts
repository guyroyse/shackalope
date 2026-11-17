import { App, applyDocumentTheme } from '@modelcontextprotocol/ext-apps'

const VERSION = '1.0.0'

/* add your own listeners before connecting, so no tool result is missed */
export function createViewApp(name: string): App {
  const app = new App({ name, version: VERSION })

  app.addEventListener('hostcontextchanged', ({ theme }) => {
    if (theme) applyDocumentTheme(theme)
  })

  return app
}

export async function connectViewApp(app: App) {
  await app.connect()

  const theme = app.getHostContext()?.theme
  if (theme) applyDocumentTheme(theme)
}
