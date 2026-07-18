import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function findSupabaseRoot(cwd: string): string | undefined {
  let dir = path.resolve(cwd)
  for (;;) {
    if (fs.existsSync(path.join(dir, 'supabase', 'config.toml'))) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

export function findGatewayTemplateDir(): string | undefined {
  const candidates = [
    path.join(__dirname, 'gateway'),
    path.join(__dirname, '..', 'gateway'),
    path.join(__dirname, '..', '..', 'gateway'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'main.ts'))) {
      return candidate
    }
  }
  return undefined
}

export function copyDirSync(src: string, dest: string, filter?: (_rel: string) => boolean) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, filter)
    } else {
      const rel = path.relative(src, srcPath)
      if (filter && !filter(rel)) continue
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

export function __dirnameFromImportMeta(meta: ImportMeta): string {
  return path.dirname(fileURLToPath(meta.url))
}

export function runCommand(
  command: string,
  args: string[],
  cwd: string,
  env?: Record<string, string>
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env } })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString()
    })
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString()
    })
    child.on('error', (err: Error) => {
      resolve({ code: -1, stdout, stderr: err.message })
    })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}
