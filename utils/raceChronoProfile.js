// Schema: Wiki vehicle_i5n.rcz. Encoding: https://racechrono.com/forum/d/2659-2659
var zip = require('./zip')
var BASE_IDS = {
  speed: 4, steering_angle: 1001, gearbox_temp: 1005, clutch_temp: 1006,
  engine_oil_pressure: 1007, tyre_temp: 1013, tyre_pressure: 1014, wheel_speed: 1015,
  wastegate_duty_cycle: 1026, engine_torque: 1029, battery_current: 1032,
  brake_pressure: 1033, battery_temp: 1037,
  analog: 5000, frequency: 5002, temperature: 5003, pressure: 5005, angle: 5010,
  percent: 5011, voltage: 5012, current: 5015, power: 5016, torque: 5017, energy: 5018,
  rpm: 10024, throttle_pos: 10025, coolant_temp: 10026, manifold_pressure: 10027,
  intake_temp: 10029, air_temp: 10031, engine_load: 10032, fuel_pressure: 10037,
  fuel_level: 10058, barometric_pressure: 10062, ecu_voltage: 10063,
  engine_oil_temp: 10066, accelerator_pos: 10071, ethanol_fuel_content: 10077
}
var POSITIONS = { '': 0, rear: 1, front: 2, rr: 3, rl: 4, fr: 5, fl: 6 }
var FAST = ['rpm', 'speed', 'wheel_speed', 'steering_angle', 'accelerator_pos', 'throttle_pos', 'brake_pressure', 'engine_torque']
function channelId(entry) {
  var base = BASE_IDS[entry.channelId], position = POSITIONS[entry.position], number = entry.sensorNumber
  if (!base || position === undefined || !Number.isInteger(number) || number < 0 || number > 63) throw new Error('无法编码通道：' + entry.name)
  return base + position * 32768 + number * 1048576
}
function hexNumber(value) {
  if (!/^0x[0-9a-f]{1,8}$/i.test(value)) throw new Error('PID 或 OBD 标头格式不正确')
  return parseInt(value.slice(2), 16)
}
function uuid() {
  // Import identity only; new identity prevents overwriting an existing profile.
  var value = ''
  for (var i = 0; i < 64; i++) value += Math.floor(Math.random() * 16).toString(16)
  return value
}
function buildProfile(entries, group) {
  var used = {}, fast = [], slow = []
  var custom = entries.map(function(entry) {
    var id = channelId(entry)
    if (used[id]) throw new Error('车辆配置中存在重复通道')
    used[id] = true
    ;(FAST.indexOf(entry.channelId) !== -1 ? fast : slow).push(id)
    return {deviceType: 5, channelId: id, pid: hexNumber(entry.values[4]), equation: entry.values[6], obdHeader: hexNumber(entry.values[2])}
  })
  return {
    localUuid: uuid(),
    selectedChannels: [{deviceType: 5, priority: 1, channelIds: fast}, {deviceType: 5, priority: 2, channelIds: slow}].filter(function(set) { return set.channelIds.length }),
    customChannels: custom,
    info: [{infoId: 1, value: 'Hyundai'}, {infoId: 2, value: 'Elantra N CN7N' + (group ? ' · 配置组 ' + group : '')}, {infoId: 8, value: 'car'}],
    obdProtocol: 6, obdDefaultHeader: 0, obdNonStandard: false
  }
}
function generate(result) {
  if (!result || !result.entries || !result.entries.length) throw new Error('没有可导出的参数')
  var groups = {}
  result.entries.forEach(function(entry) { (groups[entry.profileGroup] || (groups[entry.profileGroup] = [])).push(entry) })
  var ids = Object.keys(groups).sort(function(a, b) { return Number(a) - Number(b) })
  var files = ids.map(function(id) {
    var profile = buildProfile(groups[id], ids.length > 1 ? id : '')
    return {name: 'vehicle_cn7n' + (ids.length > 1 ? '_' + id : '') + '.rcz', data: new Uint8Array(zip.buildZip([{name: 'vehicleProfile.json', data: zip.utf8Bytes(JSON.stringify(profile))}]))}
  })
  return {
    fileName: files.length === 1 ? files[0].name : 'vehicle_cn7n_profiles.zip',
    buffer: files.length === 1 ? files[0].data.buffer : zip.buildZip(files),
    profileCount: files.length, total: result.entries.length
  }
}
module.exports = { generate: generate, channelId: channelId }
