const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm')
const app = {globalData: {selectedIds: ['179849'], filterEcu: 'engine', filterType: ''}}
let definition, navigations = []
const file = path.resolve('pages/filter/filter.js')
vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
  require: name => require(path.resolve(path.dirname(file), name)), Page: page => definition = page,
  getApp: () => app, wx: {showShareMenu() {}, navigateTo: options => navigations.push(options.url)}
})
function page() { const p = {...definition, data: JSON.parse(JSON.stringify(definition.data))}; p.setData = patch => Object.assign(p.data, patch); return p }
const p = page(); p.onLoad({}); p.onShow()
assert.equal(p.data.model, 'elantra'); assert.equal(p.data.cartCount, 1)
p.onModelChange({currentTarget: {dataset: {model: '5n'}}}); p.onShow()
assert.equal(p.data.model, '5n'); assert.equal(p.data.cartOpen, false)
p.onViewParams(); p.onViewSelected(); assert.equal(navigations.length, 0)
assert.deepEqual(app.globalData.selectedIds, ['179849'])
assert(p.onShareAppMessage().path.endsWith('model=5n')); assert.equal(p.onShareTimeline().query, 'model=5n')
p.onModelChange({currentTarget: {dataset: {model: 'elantra'}}})
assert.equal(p.data.cartCount, 1); assert.equal(app.globalData.filterEcu, 'engine')
p.onViewParams(); assert.equal(navigations.length, 1)
const shared = page(); shared.onLoad({model: '5n'}); assert.equal(shared.data.model, '5n')
const invalid = page(); invalid.onLoad({model: 'bogus'}); assert.equal(invalid.data.model, 'elantra')
const markup = fs.readFileSync('pages/filter/filter.wxml', 'utf8')
assert(markup.includes('data-model="5n"')); assert(markup.includes('参数数据整理中'))
console.log('PASS: OBD model tabs, preserved EN selection/filter, empty 5N entry, export guard and model-aware sharing')
