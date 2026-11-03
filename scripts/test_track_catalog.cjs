const assert = require('node:assert/strict')
const catalog = require('../data/tracks')
const { TRACKS, REGIONS, REGION_TRACKS, REGION_ORDER } = require('../utils/trackCatalog')
// Published IDs are compatibility data, independent of display order.
const publishedTracks = ["北京锐思赛车场","北京易车金港赛车场","浙江国际赛车场","宁波国际赛车场","上海天马赛车场","上海国际赛车场","成都天府国际赛车场","广东竞速国际赛车场（麻涌）","纽博格林北环（完整圈 20.832km）","纽博格林北环（BTG 桥到龙门架）","鄂尔多斯国际赛车场","天津V1国际赛车场（2.4km）","株洲国际赛车场","武汉国际赛道","珠海国际赛车场","广东国际赛车场","山东菏泽国际赛车场","首钢赛车场","天津GOGOGO赛车场","天津V1国际赛车场（4.29km）"]
const publishedRegions = ["北京","浙江","上海","四川","广东","德国","内蒙古","天津","湖南","湖北","山东","河北"]
assert.deepEqual(TRACKS.slice(0, publishedTracks.length), publishedTracks)
assert.deepEqual(REGIONS.slice(0, publishedRegions.length), publishedRegions)
const publishedMembership = [0,0,1,1,2,2,3,4,5,5,6,7,8,9,4,4,10,11,7,7]
for (const [id, region] of publishedMembership.entries()) {
  assert.equal(catalog.tracks[id].region, region)
  assert(REGION_TRACKS[region].includes(id))
}
require('./build_lap_config.cjs').build(true)
assert.equal(REGIONS[REGION_ORDER.at(-1)], '德国')
const vm = require('node:vm'), fs = require('node:fs')
const fixture = {regions: [
  {id: 0, name: '国内Z', pinyin: 'z'}, {id: 1, name: '国外A', pinyin: 'a', overseas: true},
  {id: 2, name: '国内B', pinyin: 'b'}, {id: 3, name: '国外C', pinyin: 'c', overseas: true}
], tracks: []}
const box = {module: {exports: {}}, require: () => fixture}
vm.runInNewContext(fs.readFileSync('utils/trackCatalog.js', 'utf8'), box)
assert.deepEqual(Array.from(box.module.exports.REGION_ORDER), [2, 0, 1, 3], 'domestic first, pinyin within each group')
console.log('PASS: published track/region IDs, membership and generated cloud files')
