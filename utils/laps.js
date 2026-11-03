const { TRACKS } = require('./trackCatalog')
const MOD_FIELDS = [{"key": "tires", "label": "轮胎"}, {"key": "wheelSize", "label": "轮毂尺寸"}, {"key": "brakeCalipers", "label": "刹车卡钳"}, {"key": "brakePads", "label": "刹车皮"}, {"key": "suspension", "label": "避震"}, {"key": "intake", "label": "进气"}, {"key": "turbo", "label": "涡轮"}, {"key": "exhaust", "label": "排气"}, {"key": "ecu", "label": "ECU"}, {"key": "tcu", "label": "TCU"}, {"key": "lightweight", "label": "轻量化"}]
// Accept phone keyboards' full-width punctuation; store one canonical lap format.
function lapMs(value) {
  const text = String(value == null ? '' : value).trim()
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0)-0xfee0))
    .replace(/[：﹕]/g, ':').replace(/[．。]/g, '.')
  const m = /^(?:(\d{1,2}):([0-5]?\d)|(\d{1,4}))(?:\.(\d{1,3}))?$/.exec(text)
  if (!m) throw new Error('圈速格式不正确，请填 1:32.456 或 92.456（秒）')
  const seconds = m[1] === undefined ? +m[3] : +m[1] * 60 + +m[2]
  const n = seconds * 1000 + +(m[4] || '').padEnd(3, '0')
  if (n <= 0) throw new Error('圈速必须大于零')
  if (n >= 6000000) throw new Error('圈速必须小于 100 分钟')
  return n
}
function formatLap(ms) {
  return String(Math.floor(ms/60000)).padStart(2,'0') + ':' + String(Math.floor(ms/1000)%60).padStart(2,'0') + '.' + String(ms%1000).padStart(3,'0')
}
function normalizeVideoLink(value) {
  if(value == null || value === '')return ''
  if(typeof value!=='string'||value.length>4096)throw new Error('视频链接内容最多 4096 字')
  if(!value.trim())return ''
  // Social apps often copy a caption together with the link. Keep only one URL.
  const links=value.match(/(?:https?:\/\/|#小程序:\/\/)[^\s<>"“”]+/gi)||[]
  if(links.length!==1)throw new Error('请粘贴一个 http(s) 视频链接或微信小程序链接')
  const link=links[0].replace(/[，。；！？，、）】》,.;!?)]+$/g,'')
  if(link.length<=2048&&/^#小程序:\/\/[^/\s]+\/[^\s]+$/.test(link))return link
  if(link.length>2048||!/^https?:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?(?:[/?#][^\s]*)?$/i.test(link))throw new Error('请检查视频链接格式，不支持小程序口令或其他协议')
  return link
}
function validate(v) {
  const out = {videoLink:normalizeVideoLink(v.videoLink)}
  const fields = {driver:30, vehicle:60}
  Object.keys(fields).forEach(k => {
    if (typeof v[k] !== 'string' || !v[k].trim() || v[k].trim().length > fields[k]) throw new Error('请完整填写信息，并检查字数')
    out[k] = v[k].trim()
  })
  if (!['原厂','改装'].includes(v.modifications)) throw new Error('请选择原厂或改装')
  out.modifications = v.modifications
  out.modificationDetails = {}
  const details = v.modificationDetails || {}
  if (typeof details !== 'object' || Array.isArray(details)) throw new Error('请检查改装信息格式')
  // Preserve old combined brake descriptions without guessing which component they mean.
  MOD_FIELDS.concat([{key:'brakes',label:'刹车（旧记录）'}]).forEach(field => {
    const value = details[field.key] === undefined ? '' : details[field.key]
    if (typeof value !== 'string' || value.trim().length > 200) throw new Error('改装详情每项最多 200 字')
    if (v.modifications === '改装' && value.trim()) out.modificationDetails[field.key] = value.trim()
  })
  if (!Number.isInteger(v.track) || !TRACKS[v.track]) throw new Error('请选择赛道')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !Number.isFinite(Date.parse(v.date + 'T00:00:00Z')) || new Date(v.date + 'T00:00:00Z').toISOString().slice(0,10) !== v.date || v.date > new Date(Date.now()+8*3600000).toISOString().slice(0,10)) throw new Error('请选择有效的非未来日期')
  const emptyTemperature = v.temperature == null || (typeof v.temperature === 'string' && !v.temperature.trim())
  const temperature = emptyTemperature ? null : Number(v.temperature)
  if (!emptyTemperature && (!['string','number'].includes(typeof v.temperature) || !Number.isFinite(temperature) || temperature < -60 || temperature > 65)) throw new Error('请填写有效气温（-60 至 65℃），或留空')
  if (!['干地','湿地'].includes(v.condition)) throw new Error('请选择干湿地')
  return Object.assign(out, {track:v.track, date:v.date, temperature, condition:v.condition, lapMs:lapMs(v.lap), lap:formatLap(lapMs(v.lap))})
}
function formatTemperature(value){return value == null || value === '' ? '未填气温' : value + '℃'}
module.exports = {TRACKS, MOD_FIELDS, lapMs, formatLap, normalizeVideoLink, validate, formatTemperature}
