var assert = require('assert/strict')
var fs = require('fs')
var path = require('path')
var vm = require('vm')
var wiki = require('../data/knowledge5n')
var page
var fileShared = false
var filePath = path.join(__dirname, '../pages/knowledge/knowledge.js')
vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), {
  require: function(name) {
    if (name === '../../utils/fileHelper') return { saveBinaryAndShare: function(name, data) { assert.equal(name, 'vehicle_i5n.rcz'); assert(data.byteLength > 0); fileShared = true } }
    return require(path.resolve(path.dirname(filePath), name))
  },
  Page: function(config) { page = config },
  getApp: function() { return { globalData: { themeMode: 'light' } } },
  wx: { showShareMenu: function() {}, getFileSystemManager: function() {
    return { readFileSync: function(p) { return fs.readFileSync(path.join(__dirname, '..', p)) } }
  } },
})
page.setData = function(patch) { Object.assign(this.data, patch) }
page.onLoad({})
var elantraTitles = page.data.sections.map(function(s) { return s.title }).join('|')
assert.equal(page.data.contacts.length, 2)
page.onSearch({ detail: { value: 'OC523' } })
assert.equal(page.data.sections.length, 1)
page.onModelChange({ currentTarget: { dataset: { model: '5n' } } })
assert.equal(page.data.query, '')
assert.equal(page.data.contacts.length, 0)
assert.equal(page.data.sections.length, 5)
page.onSearch({ detail: { value: 'OC523' } })
assert.equal(page.data.sections.length, 0)
page.onSearch({ detail: { value: 'ICCU' } })
assert(page.data.sections.length > 0)
assert(page.onShareAppMessage().path.endsWith('model=5n'))
page.onShareResource({ currentTarget: { dataset: wiki.sections[4].cards[0].resource } })
assert(fileShared)
page.onModelChange({ currentTarget: { dataset: { model: 'elantra' } } })
assert.equal(page.data.sections.map(function(s) { return s.title }).join('|'), elantraTitles)
assert.equal(page.data.contacts.length, 2)
page.onLoad({ model: '5n' })
assert.equal(page.data.model, '5n')
var images = []
wiki.sections.forEach(function(section) {
  section.cards.forEach(function(card) {
    assert(card.lines.length > 0)
    ;(card.images || []).forEach(function(image) {
      assert(fs.existsSync(path.join(__dirname, '..', image)), image)
      images.push(image)
    })
  })
})
assert.equal(images.length, 19)
console.log('PASS: model tabs, isolated content/search/contacts, share route, RC attachment, 19 images, five sections')
