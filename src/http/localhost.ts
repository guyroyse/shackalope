import type { Context, Next } from 'hono'

const LOCALHOST_NAMES = ['localhost', '127.0.0.1', '[::1]']

/* blocks DNS rebinding: a hostile domain that resolves to 127.0.0.1
   still sends its own name as the Host */
export async function requireLocalHost(context: Context, next: Next) {
  const host = context.req.header('host')
  const hostname = host ? hostnameOf(`http://${host}`) : null

  if (!isLocalhost(hostname)) return context.text('Forbidden', 403)
  await next()
}

/* blocks other websites from reaching us through the user's browser;
   non-browser MCP clients send no Origin at all */
export async function requireLocalOrigin(context: Context, next: Next) {
  const origin = context.req.header('origin')

  if (origin !== undefined && !isLocalhost(hostnameOf(origin)))
    return context.text('Forbidden', 403)

  await next()
}

function isLocalhost(hostname: string | null): boolean {
  return hostname !== null && LOCALHOST_NAMES.includes(hostname)
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}
