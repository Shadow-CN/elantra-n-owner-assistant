var assert = require('assert/strict')
var fs = require('fs')
var vm = require('vm')
var path = require('path')
var pids = require('../data/pids')
var exporter = require('../utils/raceChronoExporter')
var result = exporter.generate(pids)
assert.equal(result.total, 2680)
assert.equal(result.skipped, 0)
var labels = ['通道', '通道后缀', 'OBD-II标头', 'OBD-II反馈前缀', 'PID', '源数据', '计算式']

function read(raw, offset, length, little, signed) {
  assert(offset + length <= raw.length)
  var bytes = raw.slice(offset, offset + length)
  if (little) bytes.reverse()
  var value = bytes.reduce(function(sum, b) { return sum * 256 + b }, 0)
  return signed && value >= Math.pow(2, length * 8 - 1) ? value - Math.pow(2, length * 8) : value
}

function evaluate(equation, raw) {
  return new Function('raw', 'bytesToUint', 'bytesToInt', 'bytesToUintLe', 'bytesToIntLe', 'return ' + equation)(
    raw,
    function(r, o, n) { return read(r, o, n, false, false) },
    function(r, o, n) { return read(r, o, n, false, true) },
    function(r, o, n) { return read(r, o, n, true, false) },
    function(r, o, n) { return read(r, o, n, true, true) }
  )
}

var identities = new Set()
result.entries.forEach(function(entry, index) {
  var pid = pids[index]
  assert.deepEqual(entry.fields.map(function(f) { return f.label }), labels)
  assert.equal(entry.values[2], '0x' + pid.rh)
  assert.equal(entry.values[4], '0x' + pid.cmd)
  assert.equal(entry.values[3], '')
  var key = entry.profileGroup + ':' + entry.channelId + ':' + entry.values[1]
  assert(!identities.has(key), 'duplicate channel: ' + key)
  identities.add(key)
  var raw = entry.values[5].slice(2).trim().split(/\s+/).map(function(b) { return parseInt(b, 16) })
  assert(raw.every(function(b) { return b === 0 }))
  assert(Number.isFinite(evaluate(entry.values[6], raw)), 'invalid equation: ' + pid.id)
  // Nonzero/high-bit patterns catch endian, signedness and extraction regressions.
  raw = raw.map(function(b, i) { return (i * 73 + 131) % 256 })
  var actual = evaluate(entry.values[6], raw)
  var expected
  if (pid.dst === 0) {
    var match = pid.cr.match(/^\((unsigned|signed)\)X \* ([0-9.]+)(?: ([+-]) ([0-9.]+))?$/)
    assert(match)
    var x = read(raw, pid.dp - 3, pid.ds, pid.bt === 1, match[1] === 'signed')
    expected = x * Number(match[2]) + (match[3] ? Number(match[4]) * (match[3] === '-' ? -1 : 1) : 0)
    if (pid.id === '179854') expected = x / 65.536 * 100
    else expected *= exporter.buildEquation(pid).channel.factor
  } else {
    var mask = pid.cr.match(/^\(Bit([0-9,]+)\s*=\s*0x([0-9a-f]+)\)/i)
    var byte = raw[pid.dp - 3]
    if (mask) {
      expected = mask[1].split(',').map(Number).sort(function(a, b) { return a - b }).reduce(function(sum, bit, i) {
        return sum + ((byte >> bit) & 1) * Math.pow(2, i)
      }, 0)
    } else expected = byte
  }
  assert(Math.abs(actual - expected) <= Math.max(1e-9, Math.abs(expected) * 1e-12), 'numeric mismatch: ' + pid.id)
})

var byId = Object.fromEntries(result.entries.map(function(e) { return [e.id, e] }))
assert.equal(byId['179849'].values[6], 'bytesToInt(raw,26,2) / 10.0')
assert.equal(byId['179854'].values[6], 'bytesToInt(raw,33,2) / 65.536 * 100.0')
var angleRaw = new Array(28).fill(0); angleRaw[26] = 0xFF; angleRaw[27] = 0xF1
assert.equal(evaluate(byId['179849'].values[6], angleRaw), -1.5)
var stateRaw = new Array(21).fill(0); stateRaw[20] = 0x82
assert.equal(evaluate(byId['215353'].values[6], stateRaw), 2)
var voltageRaw = new Array(6).fill(0); voltageRaw[5] = 200
assert(Math.abs(evaluate(byId['215243'].values[6], voltageRaw) - 13.62) < 1e-10)
assert(byId['215245'].values[6].startsWith('bytesToUintLe('))

var expectedChannels = {
  '276407': ['tyre_temp', 'FL', 'tyre_temp_fl'],
  '276412': ['tyre_temp', 'FR', 'tyre_temp_fr'],
  '276417': ['tyre_temp', 'RL', 'tyre_temp_rl'],
  '276422': ['tyre_temp', 'RR', 'tyre_temp_rr'],
  '276406': ['tyre_pressure', 'FL', 'tyre_pressure_fl'],
  '276411': ['tyre_pressure', 'FR', 'tyre_pressure_fr'],
  '276416': ['tyre_pressure', 'RL', 'tyre_pressure_rl'],
  '276421': ['tyre_pressure', 'RR', 'tyre_pressure_rr'],
  '179814': ['wheel_speed', 'FL', 'wheel_speed_fl'],
  '179815': ['wheel_speed', 'FR', 'wheel_speed_fr'],
  '179816': ['wheel_speed', 'RL', 'wheel_speed_rl'],
  '179817': ['wheel_speed', 'RR', 'wheel_speed_rr'],
  '193946': ['clutch_temp', '1', 'clutch_temp_1'],
  '193947': ['clutch_temp', '2', 'clutch_temp_2'],
  '193960': ['gearbox_temp', '1', 'gearbox_temp_1'],
  '193961': ['gearbox_temp', '2', 'gearbox_temp_2'],
}
Object.keys(expectedChannels).forEach(function(id) {
  var entry = byId[id]
  assert.deepEqual([entry.channelId, entry.values[1], entry.channelIdentifier], expectedChannels[id], id)
  var single = exporter.generate([pids.find(function(pid) { return pid.id === id })]).entries[0]
  assert.equal(single.channelIdentifier, entry.channelIdentifier, 'single selection changed semantic identity: ' + id)
})
assert.equal(byId['215251'].channelId, 'coolant_temp')
assert.equal(byId['215255'].channelId, 'intake_temp')
assert.equal(byId['215256'].channelId, 'engine_oil_temp')
assert.equal(byId['215249'].channelId, 'manifold_pressure')
assert.equal(byId['215248'].channelId, 'voltage', 'MAP voltage must not become manifold pressure')
assert.equal(byId['215250'].channelId, 'voltage', 'coolant sensor voltage must not become coolant temperature')
assert.equal(byId['215253'].channelId, 'voltage', 'barometric sensor voltage must not become pressure')
assert.equal(byId['276431'].channelId, 'pressure', 'warning threshold must not become actual tyre pressure')
assert.equal(byId['276426'].channelId, 'temperature', 'reference temperature must not become tyre temperature')
assert.equal(byId['193930'].channelId, 'analog', 'shaft RPM must not become engine RPM')
assert.equal(byId['193936'].channelId, 'engine_torque')
assert.equal(byId['185034'].channelId, 'torque', 'steering torque must not become engine torque')
assert.equal(byId['215523'].channelId, 'accelerator_pos')
assert.equal(byId['193928'].channelId, 'throttle_pos')
assert.equal(byId['215524'].channelId, 'voltage', 'pedal voltage must not become pedal position')
assert.equal(byId['215581'].channelId, 'pressure', 'setpoint must not become current fuel pressure')
assert.equal(byId['215341'].channelId, 'temperature', 'start snapshot must not become current coolant temperature')
var tyreVariants = pids.filter(function(pid) { return ['276407', '276552', '276581'].indexOf(pid.id) !== -1 })
var forward = exporter.generate(tyreVariants).entries
var reversed = exporter.generate(tyreVariants.slice().reverse()).entries
forward.forEach(function(entry) {
  assert.equal(entry.channelIdentifier, reversed.find(function(other) { return other.id === entry.id }).channelIdentifier)
})
assert.equal(exporter.generate(tyreVariants).entries.find(function(entry) { return entry.id === '276407' }).values[1], 'FL')

var page
var clipboard = []
var sharedContent
var app = { globalData: { selectedIds: ['179849', '179854'], themeMode: 'light' } }
var pagePath = path.join(__dirname, '../pages/racechrono/racechrono.js')
vm.runInNewContext(fs.readFileSync(pagePath, 'utf8'), {
  require: function(name) {
    if (name === '../../utils/fileHelper') return { saveAndShare: function(filename, content) { sharedContent = content } }
    return require(path.resolve(path.dirname(pagePath), name))
  },
  Page: function(config) { page = config }, getApp: function() { return app },
  wx: { setClipboardData: function(args) { clipboard.push(args.data); args.success() }, showToast: function() {} },
})
page.setData = function(patch) { Object.assign(this.data, patch) }
page.onLoad()
assert.equal(page.data.total, 2)
for (var i = 0; i < 7; i++) page.onCopy({ currentTarget: { dataset: { entry: 0, field: i } } })
assert.deepEqual(clipboard, page.data.entries[0].values)
app.globalData.selectedIds = pids.slice(0, 25).map(function(pid) { return pid.id })
page.onLoad()
assert.equal(page.data.total, 25)
assert.equal(page.data.entries.length, 1)
page.onNext(); assert.equal(page.data.page, 2)
page.onSearch({ detail: { value: '215243' } })
assert.equal(page.data.total, 1); assert.equal(page.data.entries[0].id, '215243')
page.onShareFile()
assert(sharedContent.includes('共 25 条配置'))
assert(!sharedContent.includes('## 215353 '))
page.onSearch({ detail: { value: '215353' } })
assert.equal(page.data.total, 0)
page.onSearch({ detail: { value: 'not-a-real-pid' } })
assert.equal(page.data.total, 0); assert.equal(page.data.pageCount, 1)
app.globalData.selectedIds = []
page.onLoad(); assert.equal(page.data.total, 0)
console.log('PASS: 2680 mappings, semantic/positional channels, single/reordered selections, unit guards, numeric vectors, seven clipboard fields, selected-only search/export/pagination')
