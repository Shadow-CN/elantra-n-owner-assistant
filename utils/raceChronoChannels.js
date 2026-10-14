// Official identifiers: https://racechrono.com/support/equations/identifiers
var POSITION_RULES = [
  [/\b(?:front[ -]+left|left[ -]+front)\b/i, 'fl'],
  [/\b(?:front[ -]+right|right[ -]+front)\b/i, 'fr'],
  [/\b(?:rear[ -]+left|left[ -]+rear)\b/i, 'rl'],
  [/\b(?:rear[ -]+right|right[ -]+rear)\b/i, 'rr'],
  [/\bfront\b/i, 'front'],
  [/\brear\b/i, 'rear'],
]

var UNIT_CHANNELS = {
  '°C': ['temperature', '温度', '°C', 1],
  'V': ['voltage', '电压', 'V', 1],
  'A': ['current', '电流', 'A', 1],
  'mA': ['current', '电流', 'A', 0.001],
  '%': ['percent', '百分比', '%', 1],
  'km/h': ['speed', '速度', 'm/s', 1 / 3.6],
  'DEG': ['angle', '角度', '°', 1],
  '°': ['angle', '角度', '°', 1],
  'rad': ['angle', '角度', '°', 180 / Math.PI],
  'Nm': ['torque', '扭矩', 'Nm', 1],
  'W': ['power', '功率', 'kW', 0.001],
  'kWh': ['energy', '能量', 'kWh', 1],
  'Hz': ['frequency', '频率', 'Hz', 1],
  'kPa': ['pressure', '压力', 'kPa', 1],
  'hPa': ['pressure', '压力', 'kPa', 0.1],
  'bar': ['pressure', '压力', 'kPa', 100],
  'MPa': ['pressure', '压力', 'kPa', 1000],
  'psi': ['pressure', '压力', 'kPa', 6.894757293168],
  'kgf/cm2': ['pressure', '压力', 'kPa', 98.0665],
}

var PRIMARY_POSITION_IDS = [
  '276406', '276407', '276411', '276412', '276416', '276417', '276421', '276422',
  '179814', '179815', '179816', '179817',
]

function positionFor(name) {
  for (var i = 0; i < POSITION_RULES.length; i++) {
    if (POSITION_RULES[i][0].test(name)) return POSITION_RULES[i][1]
  }
  return ''
}

function channelFor(pid) {
  var name = pid.name_en || ''
  var unit = pid.unit || ''
  var spec = pid.dst === 0 ? UNIT_CHANNELS[unit] : null
  var channel = spec
    ? { id: spec[0], name: spec[1], unit: spec[2], factor: spec[3], basis: '单位匹配的通用通道' }
    : { id: 'analog', name: '模拟', unit: unit || '无单位', factor: 1, basis: '无已确认的专用映射，保留原始数值/单位' }
  channel.position = positionFor(name)
  channel.preferredNumber = null
  channel.priority = 2
  if (pid.dst !== 0) return channel

  function use(id, label) {
    channel.id = id
    channel.name = label
    channel.basis = '参数含义与单位匹配的专用通道'
    channel.priority = 1
  }

  if (unit === 'rpm' && /^(Actual Engine Speed|Engine RPM|Engine Speed)$/i.test(name)) {
    use('rpm', '发动机转速')
    channel.unit = 'rpm'
  }
  if (channel.id === 'temperature') {
    if (/Tire Pressure Monitoring/i.test(pid.ecu) && !/ambient|reference|reset|threshold/i.test(name) && /Temperature/i.test(name)) {
      use('tyre_temp', '轮胎温度')
    } else if (/^Clutch [12] Temperature/i.test(name) && /Dual Clutch Transmission/i.test(pid.ecu)) {
      use('clutch_temp', '离合器温度')
      channel.preferredNumber = Number(name.match(/^Clutch (\d+)/i)[1])
    } else if (/^Oil Temperature Sensor [12]$/i.test(name) && /Dual Clutch Transmission/i.test(pid.ecu)) {
      use('gearbox_temp', '变速箱温度')
      channel.preferredNumber = Number(name.match(/(\d+)$/)[1])
    } else if (/Engine Control/i.test(pid.ecu)) {
      if (/^(?:Calculated )?Engine Oil Temperature$|^Oil Temperature$/i.test(name)) use('engine_oil_temp', '发动机机油温度')
      else if (/^Water Temperature$/i.test(name)) use('coolant_temp', '冷却液温度')
      else if (/^Intake Air Temperature(?: Sensor)?$/i.test(name)) use('intake_temp', '进气温度')
      else if (/^Ambient Air Temperature(?: Sensor| from NVLD\(HEV\))?$/i.test(name)) use('air_temp', '环境空气温度')
      else if (/^Battery Sensor Temperature/i.test(name)) use('battery_temp', '电池温度')
    }
  } else if (channel.id === 'pressure') {
    if (/Tire Pressure Monitoring/i.test(pid.ecu) && /Pressure/i.test(name) && !/recommended|reference|threshold|warning/i.test(name)) {
      use('tyre_pressure', '轮胎压力')
    } else if (pid.ecu === 'Brake' && /^(?:Primary |Secondary )?Pressure Sensor$/i.test(name)) {
      use('brake_pressure', '刹车压力')
    } else if (/Engine Control/i.test(pid.ecu)) {
      if (/Manifold Absolute Pressure/i.test(name)) use('manifold_pressure', '进气歧管绝对压力')
      else if (/^(?:Barometric Pressure Sensor|Adapted Atmospheric Pressure)$/i.test(name)) use('barometric_pressure', '大气压力')
      else if (/^Engine Oil Pressure/i.test(name)) use('engine_oil_pressure', '发动机机油压力')
      else if (/^Fuel Pressure$/i.test(name)) use('fuel_pressure', '燃油压力')
    }
  } else if (channel.id === 'speed' && /Wheel Speed/i.test(name)) {
    use('wheel_speed', '轮速')
  } else if (channel.id === 'angle') {
    if (/Steering Angle/i.test(name)) use('steering_angle', '转向角')
  } else if (channel.id === 'voltage') {
    if (pid.ecu === 'Engine Control' && /^Battery Voltage(?: after IG Key)?$/i.test(name)) use('ecu_voltage', 'ECU电压')
  } else if (channel.id === 'current' && /^Battery Sensor Current/i.test(name)) {
    use('battery_current', '电池电流')
  } else if (channel.id === 'torque' && /^Engine Torque$/i.test(name)) {
    use('engine_torque', '发动机扭矩')
  } else if (channel.id === 'percent') {
    if (/^Accelerator Pedal(?: Position(?: Sensor)?)?$/i.test(name)) use('accelerator_pos', '油门踏板位置')
    else if (/^Throttle Position Sensor(?: Angle)?$/i.test(name)) use('throttle_pos', '节气门位置')
    else if (/^(?:Filtered Fuel Tank Level Value|Fuel Level(?: \(Option\))?)$/i.test(name)) use('fuel_level', '燃油液位')
    else if (/^Fuel Tank Ethanol Ratio$/i.test(name)) use('ethanol_fuel_content', '乙醇含量')
    else if (/^Engine Load$/i.test(name)) use('engine_load', '发动机负荷')
    else if (/^Wastegate Duty Cycle/i.test(name)) use('wastegate_duty_cycle', '废气旁通阀占空比')
  }

  // Preserve the primary live four-wheel channels as positional identities.
  if (PRIMARY_POSITION_IDS.indexOf(String(pid.id)) !== -1) {
    channel.preferredNumber = 0
    channel.priority = 0
  }
  return channel
}

function postfix(position, number) {
  return [position ? position.toUpperCase() : '', number ? String(number) : ''].filter(Boolean).join(' ')
}

function identifier(id, position, number) {
  return [id, position, number ? String(number) : ''].filter(Boolean).join('_')
}

module.exports = { channelFor: channelFor, postfix: postfix, identifier: identifier }
