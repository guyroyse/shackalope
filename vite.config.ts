import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { defineConfig } from 'vite'
import type { EnvironmentOptions, Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const ROOT = import.meta.dirname
const OUTPUT = join(ROOT, 'dist')
const VIEW_SOURCE = join(ROOT, 'src', 'mcp', 'views')
const SERVER_ENVIRONMENT = 'server'
const HYPHENS = /-/g

const MCP_PATH = '/mcp'
const MCP_PORT = process.env.PORT ?? 3000

const views = findViews()

/* one build for the server, plus one per view: a view must be a single
   self-contained page, and single-file output works one page at a time */
export default defineConfig({
  root: VIEW_SOURCE,
  resolve: { tsconfigPaths: true },
  /* typed as the broad PluginOption, but it returns a single plugin */
  plugins: [onlyForViews(viteSingleFile() as Plugin)],

  environments: {
    [SERVER_ENVIRONMENT]: serverEnvironment(),
    ...Object.fromEntries(
      views.map(name => [environmentName(name), viewEnvironment(name)])
    )
  },

  /* only ours: Vite's built-in client environment has nothing to build */
  builder: {
    async buildApp(builder) {
      const names = [SERVER_ENVIRONMENT, ...views.map(environmentName)]
      for (const name of names) await builder.build(builder.environments[name])
    }
  },

  /* the dev server hosts the view preview at /preview/; proxying /mcp keeps
     the preview's MCP client same-origin with the running server */
  server: {
    proxy: { [MCP_PATH]: `http://localhost:${MCP_PORT}` }
  }
})

function serverEnvironment(): EnvironmentOptions {
  return {
    consumer: 'server',
    build: {
      outDir: OUTPUT,
      emptyOutDir: false,
      target: 'node24',
      sourcemap: true,
      rollupOptions: {
        input: join(ROOT, 'src', 'server.ts'),
        output: { entryFileNames: 'server.js' }
      }
    }
  }
}

/* written to dist/views/<name>/app/index.html, mirroring the source layout */
function viewEnvironment(name: string): EnvironmentOptions {
  return {
    consumer: 'client',
    build: {
      outDir: join(OUTPUT, 'views'),
      emptyOutDir: false,
      target: 'es2022',
      rollupOptions: { input: indexOf(name) }
    }
  }
}

function onlyForViews(plugin: Plugin): Plugin {
  return {
    ...plugin,
    applyToEnvironment: environment => environment.name !== SERVER_ENVIRONMENT
  }
}

/* a view is any folder under views/ with an app/index.html */
function findViews(): string[] {
  return readdirSync(VIEW_SOURCE, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => existsSync(indexOf(name)))
}

/* environment names allow only letters, digits, $, and _ */
function environmentName(view: string): string {
  return `view_${view.replace(HYPHENS, '_')}`
}

function indexOf(name: string): string {
  return join(VIEW_SOURCE, name, 'app', 'index.html')
}
