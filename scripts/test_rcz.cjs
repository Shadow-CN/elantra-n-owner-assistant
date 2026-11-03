const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const exporter = require('../utils/raceChronoExporter')
const profiles = require('../utils/raceChronoProfile')
const pids = require('../data/pids')
const selected = pids.filter(pid => ['179849', '179854'].includes(pid.id))
const ordinary = profiles.generate(exporter.generate(selected))
assert.equal(ordinary.fileName, 'vehicle_cn7n.rcz')
assert.equal(ordinary.profileCount, 1)
assert.throws(() => profiles.generate({entries: []}), /没有可导出/)
assert.equal(profiles.channelId({channelId: 'wheel_speed', position: 'fl', sensorNumber: 0}), 197623)
assert.equal(profiles.channelId({channelId: 'tyre_temp', position: 'fl', sensorNumber: 1}), 1246197)
assert.throws(() => profiles.channelId({channelId: 'analog', position: '', sensorNumber: 64}))
assert.throws(() => profiles.channelId({channelId: 'unknown', position: '', sensorNumber: 0}))
const candidates = pids.filter(pid => {
  const entry = exporter.pidToEntry(pid)
  return entry.channelId === 'analog' && !entry.position
}).slice(0, 70)
assert.equal(candidates.length, 70)
const grouped = profiles.generate(exporter.generate(candidates))
assert.equal(grouped.profileCount, 2)
assert.equal(grouped.fileName, 'vehicle_cn7n_profiles.zip')
const all = profiles.generate(exporter.generate(pids))
// Python's independent ZIP parser verifies CRCs, directory structure and UTF-8 JSON,
// including the original deflated 5N profile and every generated split profile.
const inspect = String.raw`
import sys,json,zipfile,io,base64
data=json.load(sys.stdin)
def unpack(raw):
 z=zipfile.ZipFile(io.BytesIO(base64.b64decode(raw)))
 assert z.testzip() is None
 if z.namelist()==['vehicleProfile.json']:
  return [json.loads(z.read('vehicleProfile.json'))]
 profiles=[]
 for name in z.namelist():
  assert name.endswith('.rcz')
  profiles.extend(unpack(base64.b64encode(z.read(name)).decode()))
 return profiles
def verify(profiles,count):
 assert sum(len(p['customChannels']) for p in profiles)==count
 for p in profiles:
  assert len(p['localUuid'])==64
  channels=p['customChannels']; ids=[c['channelId'] for c in channels]
  assert len(ids)==len(set(ids))
  enabled=[c for group in p['selectedChannels'] for c in group['channelIds']]
  assert sorted(ids)==sorted(enabled)
  assert all(c['deviceType']==5 and isinstance(c['pid'],int) and isinstance(c['obdHeader'],int) and c['equation'] for c in channels)
ordinary=unpack(data['ordinary']); verify(ordinary,2)
assert [c['pid'] for c in ordinary[0]['customChannels']]==data['pids']
assert [c['obdHeader'] for c in ordinary[0]['customChannels']]==data['headers']
assert [c['equation'] for c in ordinary[0]['customChannels']]==data['equations']
verify(unpack(data['grouped']),70)
verify(unpack(data['all']),2680)
original=unpack(data['original']); verify(original,11)
assert original[0]['customChannels'][0]['channelId']==1042
print('PASS: independent ZIP/CRC/UTF-8 verification, exact PID/header/equation mapping, channel suffix encoding, 70-channel split, all 2680 entries and original 5N fixture')
`
const result = exporter.generate(selected)
const payload = {
  ordinary: Buffer.from(ordinary.buffer).toString('base64'),
  grouped: Buffer.from(grouped.buffer).toString('base64'),
  all: Buffer.from(all.buffer).toString('base64'),
  original: fs.readFileSync('packages/knowledge/assets/knowledge/ioniq5n/vehicle_i5n.rcz').toString('base64'),
  pids: result.entries.map(entry => parseInt(entry.values[4], 16)),
  headers: result.entries.map(entry => parseInt(entry.values[2], 16)),
  equations: result.entries.map(entry => entry.values[6])
}
process.stdout.write(execFileSync('python', ['-c', inspect], {input: JSON.stringify(payload), encoding: 'utf8', maxBuffer: 1024 * 1024}))
