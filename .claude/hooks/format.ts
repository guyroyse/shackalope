/* PostToolUse hook: formats the file Claude just edited or wrote with
   Prettier, which decides what to skip via .prettierignore and .gitignore */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'

const projectDirectory = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const prettier = join(projectDirectory, 'node_modules', '.bin', 'prettier')

const input = JSON.parse(readFileSync(0, 'utf8'))
const filePath: string | undefined =
  input.tool_input?.file_path ?? input.tool_response?.filePath

/* leave files outside the project (memory, scratchpad) alone */
const path = filePath && relative(projectDirectory, filePath)
const inProject = path && !path.startsWith('..') && !isAbsolute(path)

if (inProject && existsSync(prettier)) {
  try {
    execFileSync(prettier, ['--write', '--ignore-unknown', filePath], {
      cwd: projectDirectory,
      stdio: ['ignore', 'ignore', 'pipe']
    })
  } catch (error) {
    /* exit code 2 hands Prettier's complaint, e.g. a syntax error, to Claude */
    const { stderr } = error as { stderr?: Buffer }
    console.error(stderr?.toString() || (error as Error).message)
    process.exit(2)
  }
}
