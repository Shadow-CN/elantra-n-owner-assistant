/**
 * paramTypes.js
 *
 * Classifies OBD parameters into user-facing type categories.
 * Classification is based on unit field and data_size_type.
 *
 * Rules (applied in order):
 * 1. data_size_type === 1 → 'switch' (bit field / status)
 * 2. unit matches a known type → corresponding type
 * 3. Fallback → 'other'
 */

/**
 * Maps unit string to param type key.
 * Key lookup is case-insensitive (unit is lowercased before lookup).
 */
const UNIT_TYPE_MAP = {
  '°c':      'temp',
  '°crk':    'temp',
  'kpa':     'pressure',
  'hpa':     'pressure',
  'bar':     'pressure',
  'mpa':     'pressure',
  'psi':     'pressure',
  'kgf/cm2': 'pressure',
  'rpm':     'rpm',
  'km/h':    'speed',
  'v':       'voltage',
  'a':       'current',
  'ma':      'current',
  '%':       'percent',
  '°tps':    'percent',
  'deg':     'angle',
  'deg/s':   'angle',
  '°/s':     'angle',
  'rad':     'angle',
  'n':       'force',
  'nm':      'force',
  'g':       'force',
  'ms':      'time',
  'sec':     'time',
  'min':     'time',
  'hour':    'time',
  'km':      'distance',
  'mm':      'distance',
  'm/s2':    'accel',
  'count':   'count',
  'times':   'count',
  'edge':    'count',
  'ohm':     'resistance',
  'ah':      'charge',
  'kwh':     'charge',
}

/**
 * Ordered list of param types for filter UI.
 */
const PARAM_TYPES = [
  { type: 'temp',       label: '温度' },
  { type: 'pressure',   label: '压力' },
  { type: 'rpm',        label: '转速' },
  { type: 'speed',      label: '速度' },
  { type: 'percent',    label: '百分比' },
  { type: 'angle',      label: '角度' },
  { type: 'voltage',    label: '电压' },
  { type: 'current',    label: '电流' },
  { type: 'force',      label: '力 / 扭矩' },
  { type: 'distance',   label: '距离' },
  { type: 'accel',      label: '加速度' },
  { type: 'count',      label: '计数' },
  { type: 'resistance', label: '电阻' },
  { type: 'charge',     label: '电量' },
  { type: 'time',       label: '时间' },
  { type: 'switch',     label: '开关 / 状态' },
  { type: 'other',      label: '其他' },
]

/**
 * Return param type key for a given PID entry.
 * @param {object} pid - entry from pids.json
 * @returns {string} type key
 */
function getParamType(pid) {
  if (pid.dst === 1) return 'switch'

  const unit = (pid.unit || '').trim().toLowerCase()
  if (unit && UNIT_TYPE_MAP[unit]) return UNIT_TYPE_MAP[unit]

  return 'other'
}

module.exports = { UNIT_TYPE_MAP, PARAM_TYPES, getParamType }
