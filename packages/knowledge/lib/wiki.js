var elantra = require('../data/knowledgeElantra')
var ioniq = require('../data/knowledge5n')
function hash(text){var n=2166136261;for(var i=0;i<text.length;i++){n^=text.charCodeAt(i);n=Math.imul(n,16777619)}return (n>>>0).toString(36)}
function content(model){return model==='5n'?ioniq:elantra}
function sections(model){return content(model).sections.map(function(section){
  return Object.assign({},section,{cards:section.cards.map(function(card){
    return Object.assign({},card,{id:'s'+section.id+'-'+hash(card.title),sectionId:section.id,sectionTitle:section.title,summary:card.summary||(card.parts?('原厂与替换型号 · '+card.parts.length+' 条参考'):(card.lines[0]||'')),displayLines:card.lines.filter(function(line,index){return !(card.partLineIndexes||[]).includes(index)}),primaryCode:card.parts&&card.parts[0]&&card.parts[0].codes[0],imageCount:(card.image?1:0)+(card.images||[]).length})
  })})
})}
function articles(model){return sections(model).reduce(function(all,s){return all.concat(s.cards)},[])}
// Keep the previous carpet-clip URL compatible with the user-renamed article.
function find(model,id){if(model!=='5n'&&id==='sparts-3v455l')id='sparts-kyq87y';return articles(model).find(function(card){return card.id===id||(card.aliases||[]).includes(id)})||null}
function url(model,id){return '/packages/knowledge/article/article?model='+encodeURIComponent(model)+'&id='+encodeURIComponent(id)}
function filter(source,query,category){
  var text=String(query||'').trim().toLowerCase()
  return source.filter(function(s){return !category||s.id===category||(s.aliases||[]).includes(category)}).map(function(s){
    return Object.assign({},s,{cards:s.cards.filter(function(card){return !text||(s.title+' '+card.title+' '+card.lines.join(' ')).toLowerCase().indexOf(text)!==-1})})
  }).filter(function(s){return s.cards.length})
}
function related(model,article){
  if(article.relatedIds&&article.relatedIds.length)return article.relatedIds.map(function(id){return find(model,id)}).filter(function(card){return card&&card.id!==article.id})
  return articles(model).filter(function(card){return card.sectionId===article.sectionId&&card.id!==article.id}).slice(0,5)
}
module.exports={content,sections,articles,find,url,filter,related}
