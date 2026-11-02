var fs = require('fs')
var path = require('path')
var assert = require('assert/strict')
var root = path.resolve(__dirname, '..')
var project = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'))
var app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
var ignores = project.packOptions.ignore || []
var subpackages = app.subPackages || []
var limit = 2 * 1024 * 1024

function slash(value) { return value.split(path.sep).join('/') }
function ignored(relative) {
  return ignores.some(function(rule) {
    if (rule.type === 'folder') return relative === rule.value || relative.startsWith(rule.value + '/')
    if (rule.type === 'file') return relative === rule.value
    if (rule.type === 'suffix') return relative.endsWith(rule.value)
    if (rule.type === 'prefix') return relative.startsWith(rule.value)
    throw new Error('Unhandled pack rule: ' + rule.type)
  })
}
function owner(relative) {
  var sub = subpackages.find(function(sub) { return relative.startsWith(sub.root + '/') })
  return sub ? sub.root : 'main'
}

var files = []
function walk(folder) {
  fs.readdirSync(path.join(root, folder), { withFileTypes: true }).forEach(function(item) {
    var relative = folder ? folder + '/' + item.name : item.name
    if (ignored(relative)) return
    assert(!item.isSymbolicLink(), 'Unexpected symlink in package: ' + relative)
    if (item.isDirectory()) walk(relative)
    else files.push({ path: relative, bytes: fs.statSync(path.join(root, relative)).size, owner: owner(relative) })
  })
}
walk('')

files.filter(function(f){return f.path.endsWith('.json')}).forEach(function(f){JSON.parse(fs.readFileSync(path.join(root,f.path),'utf8'))})

var totals = { main: 0 }
files.forEach(function(file) { totals[file.owner] = (totals[file.owner] || 0) + file.bytes })
Object.keys(totals).forEach(function(name) {
  console.log(name + ': ' + totals[name] + ' bytes (' + (totals[name] / 1024 / 1024).toFixed(2) + ' MiB)')
  assert(totals[name] < limit, name + ' source files exceed 2 MiB before compilation')
})
console.log('Largest main-package files:')
files.filter(function(file) { return file.owner === 'main' }).sort(function(a, b) { return b.bytes - a.bytes }).slice(0, 5).forEach(function(file) {
  console.log('  ' + file.path + ': ' + file.bytes)
})

var roots = subpackages.map(function(sub) { return sub.root })
roots.forEach(function(subroot) {
  assert(!roots.some(function(other) { return other !== subroot && subroot.startsWith(other + '/') }), 'Nested subpackage')
})
var routes = app.pages.concat(subpackages.flatMap(function(sub) {
  return sub.pages.map(function(page) { return sub.root + '/' + page })
}))
routes.forEach(function(route) {
  ;['.js', '.json', '.wxml', '.wxss'].forEach(function(extension) {
    assert(files.some(function(file) { return file.path === route + extension }), 'Missing/ignored page: ' + route + extension)
  })
})

files.filter(function(file) { return file.path.endsWith('.js') }).forEach(function(file) {
  var source = fs.readFileSync(path.join(root, file.path), 'utf8')
  var matches = source.matchAll(/require\(['"]([^'"]+)['"]\)/g)
  for (var match of matches) {
    var request = match[1]
    if (!request.startsWith('.')) continue
    var target = slash(path.relative(root, path.resolve(root, path.dirname(file.path), request)))
    if (!target.endsWith('.js')) target += '.js'
    assert(files.some(function(file) { return file.path === target }), 'Missing/ignored require: ' + file.path + ' -> ' + target)
    var targetOwner = owner(target)
    assert(targetOwner === 'main' || targetOwner === file.owner, 'Cross-package require: ' + file.path + ' -> ' + target)
  }
})

var assetMap = require('../cloudfunctions/wikiFiles/assets.json')
;['knowledge5n','knowledgeElantra'].forEach(function(name){
 var wiki=require('../packages/knowledge/data/'+name)
 wiki.sections.forEach(function(section){section.cards.forEach(function(card){
  var resources=(card.image?[card.image]:[]).concat(card.images||[],(card.blocks||[]).filter(function(b){return b.type==='image'}).map(function(b){return b.src}),card.resource?[card.resource.path]:[])
  resources.forEach(function(resource){
   var relative=resource.replace(/^\//,'')
   assert(fs.existsSync(path.join(root,relative)),'Missing local source asset: '+relative)
   assert(ignored(relative),'Cloud asset still bundled: '+relative)
   assert(assetMap[resource]&&assetMap[resource].startsWith('cloud://'),'Missing cloud mapping: '+relative)
  })
 })})
})
assert(ignored('venv/Lib/site-packages/example.py'))
assert(ignored('ioniq_5n_china_owner_wiki-main/docs/public/manual/5n manual.pdf'))
assert(ignored('data/avante_n_cn7_profile_614_all_pids.csv'))
assert.equal(owner('data/pids.js'), 'main')

var legacy
var redirected
require('vm').runInNewContext(fs.readFileSync(path.join(root, 'pages/knowledge/knowledge.js'), 'utf8'), {
  Page: function(page) { legacy = page }, wx: { redirectTo: function(options) { redirected = options.url } },
})
legacy.onLoad({ model: '5n' })
assert.equal(redirected, '/packages/knowledge/knowledge/knowledge?model=5n')
legacy.onLoad({ model: 'invalid' })
assert.equal(redirected, '/packages/knowledge/knowledge/knowledge?model=elantra')
console.log('PASS: package budgets, route files, require boundaries, resource paths and legacy links')
