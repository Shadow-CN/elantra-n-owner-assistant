/**
 * ecuCategories.js
 *
 * Maps CSV ecu_name_en to user-facing Chinese group labels.
 * Keep all classification logic here; do not scatter it across page JS.
 *
 * ECU_MAP: ecu_name_en (exact string) -> { group, label }
 * ECU_GROUPS: ordered list of groups for UI display
 */

// key: exact ecu_name_en string from CSV / pids.json
// group: internal key used for filtering
// label: Chinese display name shown in UI
const ECU_MAP = {
  'Engine Control': { group: 'engine', label: '发动机' },
  'Dual Clutch Transmission (DCT)': { group: 'dct', label: '变速箱 / DCT' },
  'Brake': { group: 'brake', label: '制动' },
  'Power Steering': { group: 'eps', label: '电动转向' },
  'Tire Pressure Monitoring (IBU-TPMS)': { group: 'tpms', label: '胎压监测' },
  'Electronic Control Suspension (ECS)': { group: 'ecs', label: '电控悬架' },
  'Electronic Differential Gear': { group: 'edg', label: '电子差速' },
  'Body Control Module (IBU-BCM)': { group: 'bcm', label: '车身控制' },
  'Integrated Central Control Unit': { group: 'iccu', label: '中央控制' },
  'Air Conditioner': { group: 'ac', label: '空调' },
  'Seat Heater Ventilation Control Unit - Front': { group: 'seat_f', label: '座椅 (前排)' },
  'Seat Heater Ventilation Control Unit - Rear': { group: 'seat_r', label: '座椅 (后排)' },
  'Power Seat Module': { group: 'seat_pwr', label: '电动座椅' },
  'Airbag': { group: 'airbag', label: '安全气囊' },
  'Smart Key Unit (IBU-SMK)': { group: 'smk', label: '智能钥匙' },
  'Cluster Module': { group: 'cluster', label: '仪表盘' },
  'Front View Camera': { group: 'fvc', label: '前视摄像头' },
  'Mood Lamp Module': { group: 'mood', label: '氛围灯' },
  'Identity Authentication Unit (IAU)': { group: 'iau', label: '身份认证' },
  'Wireless Power Charger': { group: 'wpc', label: '无线充电' },
  'Multi Function Switch': { group: 'mfs', label: '多功能开关' },
  'Rear View Monitor': { group: 'rvm', label: '倒车影像' },
  'Rear Corner Radar - Left': { group: 'rcr_l', label: '后角雷达 (左)' },
  'Rear Corner Radar - Right': { group: 'rcr_r', label: '后角雷达 (右)' },
  'Immobilizer (IBU-IMMO)': { group: 'immo', label: '防盗' },
  'Transmitter Code Saving': { group: 'tcs', label: '遥控器编码' },
  'Occupant Detection Sensor': { group: 'ods', label: '乘员检测' },
}

/**
 * Ordered list of ECU groups for filter UI.
 * 常用参数优先排在前面。
 */
const ECU_GROUPS = [
  { group: 'engine',   label: '发动机' },
  { group: 'dct',      label: '变速箱 / DCT' },
  { group: 'brake',    label: '制动' },
  { group: 'eps',      label: '电动转向' },
  { group: 'tpms',     label: '胎压监测' },
  { group: 'ecs',      label: '电控悬架' },
  { group: 'edg',      label: '电子差速' },
  { group: 'bcm',      label: '车身控制' },
  { group: 'iccu',     label: '中央控制' },
  { group: 'ac',       label: '空调' },
  { group: 'seat_f',   label: '座椅 (前排)' },
  { group: 'seat_r',   label: '座椅 (后排)' },
  { group: 'seat_pwr', label: '电动座椅' },
  { group: 'airbag',   label: '安全气囊' },
  { group: 'smk',      label: '智能钥匙' },
  { group: 'cluster',  label: '仪表盘' },
  { group: 'fvc',      label: '前视摄像头' },
  { group: 'mood',     label: '氛围灯' },
  { group: 'iau',      label: '身份认证' },
  { group: 'wpc',      label: '无线充电' },
  { group: 'mfs',      label: '多功能开关' },
  { group: 'rvm',      label: '倒车影像' },
  { group: 'rcr_l',    label: '后角雷达 (左)' },
  { group: 'rcr_r',    label: '后角雷达 (右)' },
  { group: 'immo',     label: '防盗' },
  { group: 'tcs',      label: '遥控器编码' },
  { group: 'ods',      label: '乘员检测' },
]

/**
 * Return { group, label } for a given ecu_name_en string.
 * Falls back to { group: 'other', label: '其他' } for unknown ECUs.
 */
function getEcuCategory(ecuName) {
  return ECU_MAP[ecuName] || { group: 'other', label: '其他' }
}

module.exports = { ECU_MAP, ECU_GROUPS, getEcuCategory }
