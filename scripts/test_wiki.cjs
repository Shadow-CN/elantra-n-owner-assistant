const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm')
const wiki=require('../packages/knowledge/lib/wiki')
for(const model of ['elantra','5n']){
 const entries=wiki.articles(model);assert.equal(new Set(entries.map(a=>a.id)).size,entries.length)
 for(const a of entries){assert.equal(wiki.find(model,a.id).title,a.title);assert(wiki.url(model,a.id).includes(encodeURIComponent(a.id)));assert.deepEqual(a.lines,wiki.content(model).sections.find(s=>s.id===a.sectionId).cards.find(c=>c.title===a.title).lines);for(const rel of wiki.related(model,a)){if(!a.relatedIds)assert.equal(rel.sectionId,a.sectionId);assert.notEqual(rel.id,a.id)}}
}
assert.equal(wiki.articles('elantra').length,34)
const model=wiki.content('elantra'),original=model.sections[0].cards.slice(),id=wiki.sections('elantra')[0].cards[0].id
try{model.sections[0].cards.reverse();assert.equal(wiki.find('elantra',id).title,original[0].title)}finally{model.sections[0].cards=original}
assert.equal(wiki.filter(wiki.sections('elantra'),'OC523','01')[0].cards.length,1)
assert.equal(wiki.filter(wiki.sections('elantra'),'OC523','02').length,0)
assert.equal(wiki.find('5n','not-an-entry'),null)
let page,nav,copied,preview,shared=false
const file=path.resolve('packages/knowledge/article/article.js')
vm.runInNewContext(fs.readFileSync(file,'utf8'),{require:name=>name==='../../../utils/fileHelper'?{saveBinaryAndShare(name,bytes){assert.equal(name,'vehicle_i5n.rcz');assert(bytes.byteLength>0);shared=true}}:require(path.resolve(path.dirname(file),name)),Page:p=>page=p,getApp:()=>({globalData:{themeMode:'light',systemTheme:'light'}}),getCurrentPages:()=>[{}],wx:{showShareMenu(){},redirectTo(o){nav=o.url},setClipboardData(o){copied=o.data},previewImage(o){preview=o},getFileSystemManager(){return {readFileSync:p=>fs.readFileSync(p)}}}})
page.setData=function(patch,cb){Object.assign(this.data,patch);if(cb)cb()}
const a=wiki.articles('5n').find(a=>a.imageCount>1)
page.onLoad({model:'5n',id:a.id});assert.equal(page.data.canGoBack,false);assert.equal(page.data.article.title,a.title);assert.equal(page.data.images.length,a.imageCount);assert.equal(page.onShareAppMessage().path,wiki.url('5n',a.id))
page.onCopyArticle();assert(copied.includes(a.title));assert(copied.includes(a.lines[0]))
page.onPreviewImage({currentTarget:{dataset:{src:page.data.images[0]}}});assert.equal(preview.urls.length,a.imageCount)
page.onCategory();assert(nav.endsWith('category='+a.sectionId))
page.onAnchor({currentTarget:{dataset:{target:'article-images'}}});assert.equal(page.data.scrollTarget,'article-images')
const attachment=wiki.articles('5n').find(a=>a.resource);page.onLoad({model:'5n',id:attachment.id});page.onShareResource();assert(shared)
page.onLoad({model:'elantra',id:'invalid'});assert.equal(page.data.article,null);page.onWikiHome();assert(nav.endsWith('model=elantra'))
console.log('PASS: unique stable article URLs, preserved content, scoped search, related entries, direct article links, gallery, attachment, copy, anchors and missing-link fallback')

// Exact source hierarchy and rich source blocks remain represented.
assert.deepEqual(wiki.content('5n').sections.map(s=>s.title),['充电','方向盘、仪表、车机、中控','保养、维护、改装','常见问题','手册与资料'])
const maintenance=wiki.content('5n').sections[2]
assert.deepEqual(maintenance.cards.map(c=>c.title),['雨刮','空调滤芯','电瓶','轮毂','轮胎','偏心螺丝','胎压传感器','OBD监测器','其他数据'])
assert(maintenance.cards.find(c=>c.title==='其他数据').blocks.some(b=>b.type==='table'&&b.headers.length===3))
const race=wiki.content('5n').sections[3].cards.find(c=>c.title==='RaceChrono读取不到OBD数据流')
assert.equal(race.blocks.filter(b=>b.type==='table').length,2)
assert(wiki.articles('5n').filter(a=>a.document).length===2)
assert(wiki.find('5n',wiki.content('5n').sections[1].cards[0].aliases[0]))
const ac=wiki.articles('elantra').find(a=>a.title==='空调滤芯')
assert.equal(ac.parts[0].name,'空调滤芯');assert.equal(ac.parts[0].codes[0],'K 97133 L1100');assert.equal(ac.displayLines.length,0)
page.onCopyLine({currentTarget:{dataset:{value:'K 97133 L1100'}}});assert.equal(copied,'K 97133 L1100')
page.onCopyLine({currentTarget:{dataset:{value:'原文行'}}});assert.equal(copied,'原文行')
console.log('PASS: source hierarchy, maintenance/OBD tables, PDF references, previous-link aliases, named part rows and exact code/line copying')

const enManual=wiki.articles('elantra').find(a=>a.title==='23款英文维修手册')
assert(enManual);assert(enManual.lines.includes('https://www.hexorcism.com/22CN7N/'))
assert.equal(wiki.find('elantra','s09-hkrioj').id,enManual.id)
assert.equal(wiki.articles('elantra').filter(a=>a.lines.includes('https://www.hexorcism.com/22CN7N/')).length,1)
console.log('PASS: EN English manual is searchable, unique and preserves the old shared article ID')

const enOwnerManual=wiki.articles('elantra').find(a=>a.document&&a.document.key==='en-owner-manual')
assert(enOwnerManual);assert.equal(enOwnerManual.sectionId,'manuals');assert.equal(enOwnerManual.document.name,'伊兰特N车主手册.pdf')
assert(wiki.filter(wiki.sections('elantra'),'车主手册','09').some(s=>s.cards.some(a=>a.id===enOwnerManual.id)))
assert(require('../cloudfunctions/wikiFiles/files.json')['en-owner-manual'].endsWith('/knowledge/en/manual/elantra-n-owner-manual-cn.pdf'))
console.log('PASS: EN owner manual is searchable and uses the existing cloud PDF reader')
