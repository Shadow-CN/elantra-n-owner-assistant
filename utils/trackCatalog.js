const catalog = require('../data/tracks')
const REGIONS = catalog.regions.map(region => region.name)
const TRACKS = catalog.tracks.map(track => track.name)
function compare(a, b) { return a < b ? -1 : a > b ? 1 : 0 }
const REGION_ORDER = catalog.regions.map(region => region.id)
  .sort((a, b) => compare(catalog.regions[a].pinyin, catalog.regions[b].pinyin))
const REGION_TRACKS = catalog.regions.map(region => catalog.tracks
  .filter(track => track.region === region.id)
  .sort((a, b) => compare(a.pinyin, b.pinyin))
  .map(track => track.id))
module.exports = { TRACKS, REGIONS, REGION_ORDER, REGION_TRACKS }
