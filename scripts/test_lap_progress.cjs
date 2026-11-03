const assert = require('node:assert/strict')
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path')
const progress = require('../utils/lapProgress')
const base = {track: 1, vehicle: 'EN', condition: '干地', modifications: '原厂'}
const rows = [
  {...base, _id:'a', date:'2026-01-01', lapMs:78200},
  {...base, _id:'b', date:'2026-02-01', lapMs:75600},
  {...base, _id:'c', date:'2026-03-01', lapMs:72750, modifications:'改装', modificationDetails:{tires:'PS4S'}},
  {...base, _id:'d', date:'2026-03-01', lapMs:77000},
  {...base, _id:'e', date:'2026-04-01', lapMs:72750},
  {...base, _id:'wet', date:'2026-01-01', lapMs:90000, condition:'湿地'},
  {...base, _id:'other-car', date:'2026-01-01', lapMs:70000, vehicle:'5N'},
  {...base, _id:'other-track', date:'2026-01-01', lapMs:60000, track:0}
]
const original = JSON.stringify(rows)
const groups = progress.summarize(rows.slice().reverse())
assert.equal(groups.length, 4)
const en = groups.find(group => group.vehicle==='EN' && group.condition==='干地' && group.recordCount===5)
assert.equal(en.bestLap, '01:12.750'); assert.equal(en.gainLabel, '累计提升 5.450 秒')
assert.equal(en.bestId, 'c'); assert.equal(en.milestones.length, 3)
assert.deepEqual(en.milestones.map(point => point.gainLabel), ['首次记录', '提升 2.600 秒', '提升 2.850 秒'])
assert.equal(en.milestones[2].configuration, '改装 · PS4S')
assert.equal(JSON.stringify(rows), original, 'statistics must not mutate editable source rows')
assert.equal(progress.summarize([{...base,_id:'old',date:'2026-01-01',lap:'01:17'}])[0].bestLap, '01:17.000')
assert.equal(progress.summarize([{...base,_id:'bad',date:'2026-01-01',lap:'bad'}]).length, 0)
assert.deepEqual(progress.summarize([]), [])

async function run() {
  const requests = []
  const all = await progress.loadAllMine(async event => {
    requests.push(event)
    return event.offset===0 ? {rows:rows.slice(0,2),hasMore:true} : {rows:rows.slice(2),hasMore:false}
  }, () => true)
  assert.equal(all.length, rows.length)
  assert.deepEqual(requests.map(event => event.offset), [0,2])
  assert(requests.every(event => event.mine===true && event.action==='list'))
  let current = true
  assert.equal(await progress.loadAllMine(async () => {current=false;return {rows:[],hasMore:false}}, () => current), null)
  await assert.rejects(progress.loadAllMine(async () => ({rows:[],hasMore:true}), () => true), /分页发生变化/)
  let page, resolveRequest
  const file=path.resolve('pages/laps/laps.js')
  vm.runInNewContext(fs.readFileSync(file,'utf8'), {require:name=>require(path.resolve(path.dirname(file),name)),Page:p=>page=p,wx:{cloud:{callFunction:()=>new Promise(resolve=>{resolveRequest=resolve})}}})
  const p={...page,data:{...page.data,tab:'mine'},_alive:true}
  p.setData=patch=>Object.assign(p.data,patch)
  let task=p.load(true)
  resolveRequest({result:{ok:true,rows,hasMore:false}});await task
  assert.equal(p.data.progressGroups.length,4);assert.equal(p.data.rows.length,rows.length)
  assert.equal(p.data.hasMore,false);assert.equal(p.data.loading,false)
  task=p.load(true);p._loadId++;p.data.tab='board'
  resolveRequest({result:{ok:true,rows,hasMore:false}});await task
  assert.equal(p.data.progressGroups.length,0,'late mine response must not overwrite another tab')
  console.log('PASS: personal PB/deltas, daily-best timeline, car/track/surface isolation, full owner pagination, legacy laps and stale-response protection')
}
run().catch(error=>{console.error(error);process.exitCode=1})
