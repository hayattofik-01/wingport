import { init } from './init.js'
import { deploy } from './deploy.js'

export { defineGateway, anthropic, openai, type WingportConfig } from './config.js'
export { init, deploy }

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const command = argv[0]

  if (command === 'init') {
    const result = await init(process.cwd())
    console.log(result.message)
    return result.ok ? 0 : 1
  }

  if (command === 'deploy') {
    const result = await deploy(process.cwd())
    console.log(result.message)
    return result.ok ? 0 : 1
  }

  console.log(`Usage: npx wingport <init|deploy>`)
  return 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code))
}
