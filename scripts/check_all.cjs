// Read-only checks: never regenerates content or deploys cloud functions.
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
const tests = fs.readdirSync(__dirname).filter(name => /^test_.+\.(?:cjs|js)$/.test(name)).sort()
const commands = tests.map(name => [path.join('scripts', name)])
commands.push(['scripts/check_package_size.js'])
const failures = []
for (const args of commands) {
  console.log('\n> node ' + args.join(' '))
  const result = spawnSync(process.execPath, args, {cwd: root, stdio: 'inherit', timeout: 60000})
  if (result.error) console.error(result.error.message)
  if (result.error || result.status !== 0) failures.push(args.join(' '))
}
console.log('\n' + (commands.length - failures.length) + '/' + commands.length + ' checks passed')
if (failures.length) { console.error('Failed: ' + failures.join(', ')); process.exitCode = 1 }
