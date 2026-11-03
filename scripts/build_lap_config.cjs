const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..')
const catalog = require('../data/tracks')
const banner = '// 自动生成：node scripts/build_lap_config.cjs；请勿手工修改。\n'
function build(check = false) {
  for (const key of ['regions', 'tracks']) {
    assert(Array.isArray(catalog[key]) && catalog[key].length, key + ' must not be empty')
    catalog[key].forEach((item, index) => {
      assert.equal(item.id, index, key + ': ID must match its stable array position')
      assert(typeof item.name === 'string' && item.name.trim(), key + ': missing name')
      assert(typeof item.pinyin === 'string' && /^[a-z0-9.-]+$/.test(item.pinyin), key + ': invalid pinyin')
    })
    assert.equal(new Set(catalog[key].map(item => item.name)).size, catalog[key].length, key + ': duplicate name')
    assert.equal(new Set(catalog[key].map(item => item.pinyin)).size, catalog[key].length, key + ': duplicate pinyin')
  }
  catalog.tracks.forEach(track => assert(Number.isInteger(track.region) && catalog.regions[track.region], 'Unknown region: ' + track.name))
  catalog.regions.forEach(region => assert(catalog.tracks.some(track => track.region === region.id), 'Region has no tracks: ' + region.name))
  const source = fs.readFileSync(path.join(root, 'utils/laps.js'), 'utf8').replace(/\r\n/g, '\n')
  const importLine = "const { TRACKS } = require('./trackCatalog')"
  assert(source.startsWith(importLine), 'Unexpected validation import; update generator explicitly')
  const output = {
    'cloudfunctions/lapBoard/tracks.js': banner + 'module.exports = ' + JSON.stringify({TRACKS: catalog.tracks.map(track => track.name)}, null, 2) + '\n',
    'cloudfunctions/lapBoard/validation.js': banner + source.replace(importLine, "const { TRACKS } = require('./tracks')")
  }
  for (const [relative, content] of Object.entries(output)) {
    const file = path.join(root, relative)
    if (check) assert(fs.existsSync(file) && fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') === content, relative + ' is stale; run node scripts/build_lap_config.cjs')
    else fs.writeFileSync(file, content, 'utf8')
  }
  console.log(check ? 'PASS: lap config and generated validation are in sync' : 'Generated lapBoard tracks.js and validation.js')
}
if (require.main === module) {
  try { build(process.argv.includes('--check')) }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
module.exports = { build }
