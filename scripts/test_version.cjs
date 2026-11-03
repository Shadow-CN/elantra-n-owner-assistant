const assert = require('node:assert/strict'), fs = require('fs'), vm = require('vm')

// 用假的 changelog 和假的 wx 存储加载 utils/version.js，避免依赖真实登录态。
function load(changelog, storage) {
  const module = { exports: {} }
  vm.runInNewContext(fs.readFileSync('utils/version.js', 'utf8'), {
    module,
    exports: module.exports,
    require: () => changelog,
    wx: {
      getStorageSync: key => storage[key],
      setStorageSync: (key, value) => { storage[key] = value },
    },
    console,
  })
  return module.exports
}

const V13 = { version: '1.3.0', date: '2026-11-03', items: ['新功能'] }
const V12 = { version: '1.2.0', date: '2026-10-01', items: ['旧功能'] }
const V11 = { version: '1.1.0', date: '2026-09-01', items: ['更旧'] }
const V10 = { version: '1.0.0', date: '2026-08-01', items: ['最初'] }

// 首次安装：不弹窗，但直接记为已读，避免下次仍然提示。
let storage = {}
assert.equal(load([V13, V12], storage).pendingUpdate(), null)
assert.equal(storage.seenVersion, '1.3.0')

// 版本没变：不弹窗。
assert.equal(load([V13, V12], { seenVersion: '1.3.0' }).pendingUpdate(), null)

// 落后一个版本：只显示最新一条。
let update = load([V13, V12], { seenVersion: '1.2.0' }).pendingUpdate()
assert.deepEqual(update.entries.map(e => e.version), ['1.3.0'])

// 落后两个版本：两条都要显示，最新在前。
update = load([V13, V12, V11], { seenVersion: '1.1.0' }).pendingUpdate()
assert.deepEqual(update.entries.map(e => e.version), ['1.3.0', '1.2.0'])

// 已读版本比当前还新（回退安装）：只提示最新一条，不误导。
update = load([V13, V12], { seenVersion: '9.9.9' }).pendingUpdate()
assert.deepEqual(update.entries.map(e => e.version), ['1.3.0'])

// 一次跨很多版本：最多提示三条。
update = load([V13, V12, V11, V10], { seenVersion: '1.0.0' }).pendingUpdate()
assert.equal(update.entries.length, 3)
assert.equal(update.version, '1.3.0')

// 点「知道了」后写入当前版本，再进首页不再弹。
storage = { seenVersion: '1.2.0' }
const util = load([V13, V12], storage)
assert.ok(util.pendingUpdate())
util.markSeen()
assert.equal(storage.seenVersion, '1.3.0')
assert.equal(load([V13, V12], storage).pendingUpdate(), null)

// 真实数据文件：结构完整，且首页依赖的字段都在。
const changelog = require('../data/changelog')
assert.ok(Array.isArray(changelog) && changelog.length >= 1)
for (const entry of changelog) {
  assert.match(entry.version, /^\d+\.\d+\.\d+$/)
  assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/)
  assert.ok(Array.isArray(entry.items) && entry.items.length >= 1)
  for (const line of entry.items) assert.ok(typeof line === 'string' && line.trim().length >= 4)
}
const real = load(changelog, { seenVersion: '0.0.1' })
assert.equal(real.pendingUpdate().version, changelog[0].version)

console.log('PASS: 首次安装/同版本/单条/多条/回退/最多三条/已读写入/更新说明数据结构')
