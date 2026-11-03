const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const before = require('../docs/wiki-before-single-source.json')
const wiki = require('../packages/knowledge/lib/wiki')
const normalize = require('../packages/knowledge/lib/content').normalizeCard
for (const model of ['elantra', '5n']) {
  const data = require('../packages/knowledge/data/' + (model === '5n' ? 'knowledge5n' : 'knowledgeElantra'))
  for (const section of data.sections) for (const card of section.cards) {
    assert(card.id, 'pin the published ID before renaming or moving articles')
    assert(!card.partLineIndexes, 'part lines are now derived')
    if (card.blocks) { assert(!card.lines); assert(!card.images); assert(!card.image) }
    const live = wiki.find(model, card.id)
    const previous = before[model].find(article => article.id === card.id)
    // Existing articles keep the exact body, part rows, image order, document and resource.
    if (previous) {
      assert.equal(crypto.createHash('sha256').update(JSON.stringify({parts: live.parts, blocks: live.blocks, body: live.blocks ? undefined : live.displayLines, images: live.images, document: live.document, resource: live.resource})).digest('hex'), previous.render, card.title)
      for (const alias of previous.aliases) assert.equal(wiki.find(model, alias).id, live.id)
    }
  }
}
const section = {id: 'parts', title: '零件'}
const original = {id: 'fixed-id', title: '旧标题', parts: [{name: '钥匙', codes: ['NEW-CODE'], note: '核对 VIN'}], lines: ['正文']}
const renamed = normalize({...original, title: '新标题'}, section)
assert.equal(renamed.id, 'fixed-id')
assert(renamed.lines.some(line => line.includes('NEW-CODE')))
assert(renamed.lines.includes('核对 VIN')); assert.deepEqual(renamed.displayLines, ['正文'])
const article = normalize({title: '图文', blocks: [{type: 'heading', text: '标题'}, {type: 'text', text: '只写一次'}, {type: 'table', headers: ['项目', '编号'], rows: [['零件', 'A001']]}, {type: 'image', src: '/one.jpg'}]}, section)
assert.deepEqual(article.lines, ['标题', '只写一次', '项目 / 编号', '零件 / A001'])
assert.deepEqual(article.images, ['/one.jpg'])
assert(!wiki.articles('elantra').find(card => card.title.includes('迎宾灯')).lines.some(line => line.includes('0101')))
console.log('PASS: single-source body/parts/images, stable IDs and all existing article rendering preserved')
