import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { init } from './init.js'
import { deploy } from './deploy.js'

let tmpDir: string
let originalPath: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wingport-cli-test-'))
  originalPath = process.env.PATH ?? ''
})

afterEach(() => {
  process.env.PATH = originalPath
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function makeSupabaseProject() {
  fs.mkdirSync(path.join(tmpDir, 'supabase'), { recursive: true })
  fs.writeFileSync(path.join(tmpDir, 'supabase', 'config.toml'), '[project]\n')
}

function writeFakeSupabase(script: string) {
  const binDir = path.join(tmpDir, 'bin')
  fs.mkdirSync(binDir, { recursive: true })
  const scriptPath = path.join(binDir, 'supabase')
  fs.writeFileSync(scriptPath, script)
  fs.chmodSync(scriptPath, 0o755)
  process.env.PATH = `${binDir}:${originalPath}`
}

describe('init', () => {
  it('scaffolds the gateway function and config', async () => {
    makeSupabaseProject()

    const result = await init(tmpDir)

    expect(result.ok).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'supabase', 'functions', 'wingport', 'main.ts'))).toBe(
      true
    )
    expect(fs.existsSync(path.join(tmpDir, 'wingport.config.ts'))).toBe(true)
  })

  it('is idempotent and preserves an edited config', async () => {
    makeSupabaseProject()
    await init(tmpDir)

    const configFile = path.join(tmpDir, 'wingport.config.ts')
    const edited = `export default { custom: true }`
    fs.writeFileSync(configFile, edited)

    const result = await init(tmpDir)

    expect(result.ok).toBe(false)
    expect(fs.readFileSync(configFile, 'utf-8')).toBe(edited)
  })

  it('errors when there is no supabase project', async () => {
    const result = await init(tmpDir)

    expect(result.ok).toBe(false)
    expect(result.message).toContain('supabase init')
  })
})

describe('deploy', () => {
  it('errors when supabase CLI is missing', async () => {
    makeSupabaseProject()
    process.env.PATH = '/nonexistent'

    const result = await deploy(tmpDir)

    expect(result.ok).toBe(false)
    expect(result.message).toContain('Supabase CLI is not installed')
  })

  it('errors when not logged in', async () => {
    makeSupabaseProject()
    writeFakeSupabase('#!/bin/sh\nif [ "$1" = "--version" ]; then echo "1.0"; exit 0; fi\necho "not logged in" >&2; exit 1')

    const result = await deploy(tmpDir)

    expect(result.ok).toBe(false)
    expect(result.message).toContain('not logged in')
  })

  it('errors when config.toml is missing', async () => {
    writeFakeSupabase('#!/bin/sh\necho ok')

    const result = await deploy(tmpDir)

    expect(result.ok).toBe(false)
    expect(result.message).toContain('supabase/config.toml')
  })

  it('errors when wingport.config.ts is missing', async () => {
    makeSupabaseProject()
    writeFakeSupabase('#!/bin/sh\necho ok')

    const result = await deploy(tmpDir)

    expect(result.ok).toBe(false)
    expect(result.message).toContain('wingport.config.ts')
  })
})
