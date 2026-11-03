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

// 首次打开也应展示，只有用户确认后写入已读。
let storage = {}
const initial = load([V13, V12], storage)
assert.equal(initial.pendingUpdate().version, '1.3.0')
assert.equal(initial.pendingUpdate().entries.length, 1)
assert.equal(storage.acknowledgedChangelogVersion, undefined)
initial.markSeen()
assert.equal(storage.acknowledgedChangelogVersion, '1.3.0')

// 版本没变：不弹窗。
assert.equal(load([V13, V12], { acknowledgedChangelogVersion: '1.3.0' }).pendingUpdate(), null)

// 落后一个版本：只显示最新一条。
let update = load([V13, V12], { acknowledgedChangelogVersion: '1.2.0' }).pendingUpdate()
assert.deepEqual(update.entries.map(e => e.version), ['1.3.0'])

// 落后两个版本：两条都要显示，最新在前。
update = load([V13, V12, V11], { acknowledgedChangelogVersion: '1.1.0' }).pendingUpdate()
assert.deepEqual(update.entries.map(e => e.version), ['1.3.0', '1.2.0'])

// 已读版本比当前还新（回退安装）：只提示最新一条，不误导。
update = load([V13, V12], { acknowledgedChangelogVersion: '9.9.9' }).pendingUpdate()
assert.deepEqual(update.entries.map(e => e.version), ['1.3.0'])

// 一次跨很多版本：最多提示三条。
update = load([V13, V12, V11, V10], { acknowledgedChangelogVersion: '1.0.0' }).pendingUpdate()
assert.equal(update.entries.length, 3)
assert.equal(update.version, '1.3.0')

// 点「知道了」后写入当前版本，再进首页不再弹。
storage = { acknowledgedChangelogVersion: '1.2.0' }
const util = load([V13, V12], storage)
assert.ok(util.pendingUpdate())
util.markSeen()
assert.equal(storage.acknowledgedChangelogVersion, '1.3.0')
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
const real = load(changelog, { acknowledgedChangelogVersion: '0.0.1' })
assert.equal(real.pendingUpdate().version, changelog[0].version)

// 旧版会静默写入seenVersion，不能误认为用户已确认。
assert.ok(load([V13], {seenVersion: '1.3.0'}).pendingUpdate())
assert.equal(load([], {}).pendingUpdate(), null)
const broken = {exports: {}}
vm.runInNewContext(fs.readFileSync('utils/version.js', 'utf8'), {module: broken, require: () => [V13], wx: {getStorageSync() {throw Error('unavailable')}, setStorageSync() {throw Error('unavailable')}}})
assert.ok(broken.exports.pendingUpdate()); broken.exports.markSeen(); assert.equal(broken.exports.pendingUpdate(), null)
// 通用组件覆盖分享直达、页面返回及前后台切换。
let component
const state = {}, version = load([V13, V12], state)
vm.runInNewContext(fs.readFileSync('components/update-notice/update-notice.js', 'utf8'), {require: () => version, Component: c => component = c})
function create() {
  const instance = {data: {...component.data}, ...component.methods}
  instance.setData = patch => Object.assign(instance.data, patch)
  return instance
}
const first = create()
component.pageLifetimes.show.call(first); assert.equal(first.data.changelogVisible, false)
component.lifetimes.ready.call(first); assert.equal(first.data.changelogVisible, true)
assert.equal(state.acknowledgedChangelogVersion, undefined)
component.pageLifetimes.hide.call(first); assert.equal(first.data.changelogVisible, false)
component.pageLifetimes.show.call(first); assert.equal(first.data.changelogVisible, true)
first.onChangelogClose(); assert.equal(state.acknowledgedChangelogVersion, '1.3.0')
component.pageLifetimes.show.call(first); assert.equal(first.data.changelogVisible, false)
const other = create(); component.lifetimes.ready.call(other); assert.equal(other.data.changelogVisible, false)
const navigation = JSON.parse(fs.readFileSync('components/navigation-bar/navigation-bar.json', 'utf8'))
assert(navigation.usingComponents['update-notice'])
assert(fs.readFileSync('components/navigation-bar/navigation-bar.wxml', 'utf8').includes('<update-notice />'))
assert(!fs.readFileSync('pages/index/index.js', 'utf8').includes('pendingUpdate'))
console.log('PASS: first-open notice, confirmed-only persistence, legacy silent-record migration, version history, page lifecycle and session deduplication')
