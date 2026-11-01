const assert=require('node:assert/strict');
const before=require('../docs/en-wiki-before-reorg.json');
const wiki=require('../packages/knowledge/lib/wiki');
const entries=wiki.articles('elantra');
// User-confirmed part-number corrections supersede the pre-reorganization snapshot.
const correctedCodes={"改款钥匙":["95440-IB500YPN"],"旧款钥匙":["95440-IB701"],"前翼子板支架":["86552 AAAA0","86551 AAAA0"]};
for(const a of before.articles){for(const id of [a.id,...(a.aliases||[])])assert(wiki.find('elantra',id),'Lost legacy link '+id);for(const p of a.parts||[])for(const code of correctedCodes[p.name]||p.codes)assert(entries.some(n=>(n.parts||[]).some(q=>q.name===p.name&&q.codes.includes(code))),'Lost part '+p.name+' '+code);if(a.image)assert(entries.some(n=>n.image===a.image));if(a.document)assert(entries.some(n=>n.document&&n.document.key===a.document.key))}
const aliases=entries.flatMap(a=>a.aliases||[]);assert.equal(new Set(aliases).size,aliases.length);
for(const a of entries)for(const id of a.relatedIds||[])assert(wiki.find('elantra',id),'Broken related link');
assert.deepEqual(wiki.content('elantra').sections.filter(s=>!s.supplemental).map(s=>s.title),['保养与规格','零件查询','轮胎与赛道','车机与功能','价格与渠道参考','手册与资料']);
for(const a of entries.filter(a=>a.sectionId!=='services'))assert(!a.lines.some(l=>l.includes('¥')));
for(const a of entries.filter(a=>a.sectionId==='services'))assert(a.lines.some(l=>l.includes('报价日期未记录')));
assert.equal(wiki.related('elantra',entries.find(a=>a.title==='其他零件索引')).length,7);
console.log('PASS: all old article links, part names/codes, images and PDFs preserved; six primary categories, historical quotes separated, related links valid');
