import { homedir } from 'node:os'
import { join } from 'node:path'

type Surroundings = {
  platform: NodeJS.Platform
  env: Record<string, string | undefined>
  home: string
}

/* the layout of the vault's contents; a future version gets its own folder
   and can migrate from this one */
const VAULT_VERSION = 'v1'

export function resolveVaultDirectory(): string {
  return vaultDirectory({
    platform: process.platform,
    env: process.env,
    home: homedir()
  })
}

export function vaultDirectory(surroundings: Surroundings): string {
  return join(appDataDirectory(surroundings), VAULT_VERSION)
}

/* where an app run by a user keeps its data, by each OS's convention */
function appDataDirectory({ platform, env, home }: Surroundings): string {
  if (platform === 'win32') {
    const localAppData = env.LOCALAPPDATA || join(home, 'AppData', 'Local')
    return join(localAppData, 'Shackalope')
  }

  if (platform === 'darwin')
    return join(home, 'Library', 'Application Support', 'Shackalope')

  const dataHome = env.XDG_DATA_HOME || join(home, '.local', 'share')
  return join(dataHome, 'shackalope')
}
