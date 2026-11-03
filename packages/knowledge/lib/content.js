// Derive search/copy text and galleries from the content displayed on screen.
// Edit parts for part numbers, blocks for rich articles, lines for simple articles.
function hash(text) {
  var n = 2166136261
  for (var i = 0; i < text.length; i++) { n ^= text.charCodeAt(i); n = Math.imul(n, 16777619) }
  return (n >>> 0).toString(36)
}
function blockLines(blocks) {
  return blocks.reduce(function(lines, block) {
    if (block.type === 'text' || block.type === 'heading') lines.push(block.text)
    if (block.type === 'table') lines = lines.concat([block.headers.join(' / ')], block.rows.map(function(row) { return row.join(' / ') }))
    return lines
  }, [])
}
function normalizeCard(card, section) {
  var body = card.blocks ? blockLines(card.blocks) : (card.lines || []).filter(function(_, index) { return !(card.partLineIndexes || []).includes(index) })
  var parts = (card.parts || []).reduce(function(lines, part) {
    lines.push([part.brand, part.name, (part.codes || []).join(' / ')].filter(Boolean).join(' '))
    if (part.note) lines.push(part.note)
    return lines
  }, [])
  var lines = parts.concat(body)
  if (card.resource) lines.push('RaceChrono OBD配置文件：' + card.resource.name)
  lines = Array.from(new Set(lines.filter(Boolean)))
  var images = card.blocks ? card.blocks.filter(function(block) { return block.type === 'image' }).map(function(block) { return block.src }) : (card.image ? [card.image] : []).concat(card.images || [])
  return Object.assign({}, card, {
    id: card.id || 's' + section.id + '-' + hash(card.title),
    lines: lines, displayLines: body, images: images, image: undefined,
    imageCount: images.length, sectionId: section.id, sectionTitle: section.title,
    summary: card.summary || (card.parts ? '原厂与替换型号 · ' + card.parts.length + ' 条参考' : (lines[0] || '')),
    primaryCode: card.parts && card.parts[0] && card.parts[0].codes[0]
  })
}
function normalize(data) {
  return Object.assign({}, data, {sections: data.sections.map(function(section) {
    return Object.assign({}, section, {cards: section.cards.map(function(card) { return normalizeCard(card, section) })})
  })})
}
module.exports = { normalize: normalize, normalizeCard: normalizeCard, blockLines: blockLines }
