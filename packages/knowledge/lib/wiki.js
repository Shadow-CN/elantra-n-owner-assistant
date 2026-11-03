var elantra = require('../data/knowledgeElantra')
var ioniq = require('../data/knowledge5n')
var normalize = require('./content').normalize
function content(model){return normalize(model==='5n'?ioniq:elantra)}
function sections(model){return content(model).sections}
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
