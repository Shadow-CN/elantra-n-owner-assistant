var assert = require('assert/strict')
var fs = require('fs')
var path = require('path')
var vm = require('vm')
var wiki = require('../packages/knowledge/lib/wiki').content('5n')
var page
var pageDepth=2,backCount=0,homeUrl=null
var jumpResult="success",jumpLink=null,modalCount=0
var sourceCopied = null
var filePath = path.join(__dirname, '../packages/knowledge/knowledge/knowledge.js')
vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), {
  require: function(name) {
    return require(path.resolve(path.dirname(filePath), name))
  },
  getCurrentPages: function(){return Array(pageDepth).fill({})},
  Page: function(config) { page = config },
  getApp: function() { return { globalData: { themeMode: 'light' } } },
  wx: { navigateToMiniProgram:function(o){jumpLink=o.shortLink;if(jumpResult==='throw')throw Error('unavailable');if(jumpResult!=='success')o.fail({errMsg:jumpResult});o.complete()},showModal:function(o){modalCount++;o.success({confirm:true})},navigateBack: function(o){assert.equal(o.delta,1);backCount++},reLaunch:function(o){homeUrl=o.url},setClipboardData: function(o) { sourceCopied=o.data }, showShareMenu: function() {}, getFileSystemManager: function() {
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
console.log('PASS: model tabs, isolated content/search/contacts, share route, 19 images, five sections')

page.onModelChange({currentTarget:{dataset:{model:'elantra'}}});assert.equal(page.data.sourceLink.url,'https://carplay.66ir.com/cn7n.html#manual');page.onSourceLinkTap();assert.equal(sourceCopied,'https://carplay.66ir.com/cn7n.html#manual')
page.onModelChange({currentTarget:{dataset:{model:'5n'}}});assert.equal(page.data.sourceLink.url,'https://5nwiki.antarescorn.fyi/');page.onSourceLinkTap();assert.equal(sourceCopied,'https://5nwiki.antarescorn.fyi/')
assert(!page.data.modelDescription.includes('https://'))
console.log('PASS: per-model source link copies only the exact URL, preserves anchors, and changes with model selection')
page.onLoad({model:'elantra',category:'01'});assert.equal(page.data.activeCategory,'parts');assert.equal(page.data.showEntries,true)
page.onAllCategories();assert.equal(page.data.showEntries,false);assert.equal(page.data.categories.length,6);assert.equal(page.data.supplementalCategories.length,1)
page.onSearch({detail:{value:'35320'}});assert.equal(page.data.showEntries,true);assert.equal(page.data.sections[0].cards[0].title,'高压油泵与垫片')
page.onLoad({model:'5n'});assert.equal(page.data.showEntries,false);assert.equal(page.data.supplementalCategories.length,0)
console.log('PASS: EN directory-only home, legacy category links, search, and 5N directory-only home')

page.onCategory({currentTarget:{dataset:{id:wiki.sections[2].id}}});assert.equal(page.data.showEntries,true);assert.equal(page.data.sections.length,1);assert.equal(page.data.sections[0].cards.length,wiki.sections[2].cards.length)
page.onAllCategories();assert.equal(page.data.showEntries,false);page.onSearch({detail:{value:"ICCU"}});assert.equal(page.data.showEntries,true);assert(page.data.resultCount>0)

for(const modelName of ['elantra','5n']){
 page.onLoad({model:modelName});const cat=page.data.categories[0].id
 page.onCategory({currentTarget:{dataset:{id:cat}}});page.onNavBack()
 assert.equal(page.data.activeCategory,'');assert.equal(page.data.showEntries,false);assert.equal(backCount,0)
 page.onCategory({currentTarget:{dataset:{id:cat}}});page.onSearch({detail:{value:'test'}});page.onNavBack()
 assert.equal(page.data.query,'');assert.equal(page.data.activeCategory,cat)
 page.onNavBack();assert.equal(page.data.showEntries,false)
}
page.onNavBack();assert.equal(backCount,1)
pageDepth=1;page.onNavBack();assert.equal(homeUrl,'/pages/index/index')
console.log('PASS: back clears search, returns category to directory, then exits wiki; direct entry has home fallback')

page.onLoad({model:"elantra",category:"experience"});assert.equal(page.data.categoryLink.url,"https://docs.qq.com/sheet/DQXZmR2pVZ0xCWVFq?tab=BB08J2");page.onCategoryLinkCopy();assert.equal(sourceCopied,page.data.categoryLink.url);page.onAllCategories();assert.equal(page.data.categoryLink,null);page.onLoad({model:"5n"});assert.equal(page.data.categoryLink,null)

page.onLoad({model:'elantra',category:'experience'});page.onCategoryLinkOpen();assert.equal(jumpLink,'#小程序://腾讯文档/91w2BqozcHlcoRt');assert.equal(modalCount,0);assert.equal(page._openingCategoryLink,false)
jumpResult='navigateToMiniProgram:fail cancel';page.onCategoryLinkOpen();assert.equal(modalCount,0)
jumpResult='navigateToMiniProgram:fail invalid';page.onCategoryLinkOpen();assert.equal(modalCount,1);assert.equal(sourceCopied,page.data.categoryLink.url)
jumpResult='throw';page.onCategoryLinkOpen();assert.equal(modalCount,2);assert.equal(page._openingCategoryLink,false)
console.log('PASS: Tencent Docs short-link dispatch, cancellation, failure copy fallback and synchronous error recovery')
