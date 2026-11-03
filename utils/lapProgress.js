const { TRACKS, lapMs, formatLap } = require('./laps')

function milliseconds(row) {
  if (Number.isInteger(row.lapMs) && row.lapMs > 0) return row.lapMs
  try { return lapMs(row.lap) } catch (error) { return null }
}

// Compare the same track/layout, vehicle name and surface condition only.
// Dates have no time-of-day: use each day's best instead of guessing lap order.
function summarize(rows) {
  const groups = new Map()
  rows.forEach(row => {
    const ms = milliseconds(row)
    if (!TRACKS[row.track] || !ms || !/^\d{4}-\d{2}-\d{2}$/.test(row.date || '')) return
    const vehicle = String(row.vehicle || '').trim()
    const key = JSON.stringify([row.track, vehicle, row.condition])
    if (!groups.has(key)) groups.set(key, { key, track: row.track, trackName: TRACKS[row.track], vehicle, condition: row.condition, rows: [] })
    groups.get(key).rows.push({ ...row, ms })
  })
  return Array.from(groups.values()).map(group => {
    const days = new Map()
    group.rows.slice().sort((a, b) => a.date.localeCompare(b.date) || a.ms - b.ms || String(a._id).localeCompare(String(b._id))).forEach(row => {
      if (!days.has(row.date)) days.set(row.date, row)
    })
    const daily = Array.from(days.values()), first = daily[0], milestones = []
    let best = null
    daily.forEach(row => {
      if (!best || row.ms < best.ms) {
        const gain = best ? best.ms - row.ms : 0
        milestones.push({ id: row._id, date: row.date, lap: formatLap(row.ms), gainLabel: best ? '提升 ' + (gain / 1000).toFixed(3) + ' 秒' : '首次记录', configuration: row.modifications + (row.modificationDetails && row.modificationDetails.tires ? ' · ' + row.modificationDetails.tires : '') })
        best = row
      }
    })
    return {
      key: group.key, trackName: group.trackName, vehicle: group.vehicle, condition: group.condition,
      recordCount: group.rows.length, bestLap: formatLap(best.ms), bestDate: best.date, bestId: best._id,
      firstDate: first.date, firstLap: formatLap(first.ms),
      gainLabel: first.ms > best.ms ? '累计提升 ' + ((first.ms - best.ms) / 1000).toFixed(3) + ' 秒' : '已记录个人最佳',
      milestones
    }
  }).sort((a, b) => b.milestones[b.milestones.length - 1].date.localeCompare(a.milestones[a.milestones.length - 1].date) || a.trackName.localeCompare(b.trackName))
}

// Existing owner-scoped API is reused; never label a partial page as a lifetime PB.
async function loadAllMine(list, isCurrent) {
  const rows = [], seen = new Set()
  let offset = 0
  while (isCurrent()) {
    const result = await list({ action: 'list', mine: true, offset })
    if (!isCurrent()) return null
    if (!Array.isArray(result.rows)) throw new Error('个人成绩数据不完整，请重新加载')
    let added = 0
    result.rows.forEach(row => {
      if (!seen.has(row._id)) { rows.push(row); seen.add(row._id); added++ }
    })
    if (!result.hasMore) return rows
    if (!added || !result.rows.length) throw new Error('个人成绩分页发生变化，请重新加载')
    offset += result.rows.length
  }
  return null
}

module.exports = { summarize, loadAllMine }
