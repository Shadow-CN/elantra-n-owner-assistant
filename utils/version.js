/**
 * version.js — 版本更新提示。
 *
 * 数据来自 data/changelog.js。只有用户关闭更新说明后才记录已读。
 * 独立的确认记录避免旧版曾自动写入的 seenVersion 导致漏提示。
 */

var CHANGELOG = require('../data/changelog')

var STORAGE_KEY = 'acknowledgedChangelogVersion'
var MAX_ENTRIES = 3
var sessionSeen = ''

function currentVersion() {
  return CHANGELOG.length ? CHANGELOG[0].version : ''
}

function getSeenVersion() {
  try {
    return sessionSeen || wx.getStorageSync(STORAGE_KEY) || ''
  } catch (e) {
    return sessionSeen
  }
}

function markSeen(version) {
  version = version || currentVersion()
  if (!version) return
  sessionSeen = version
  try {
    wx.setStorageSync(STORAGE_KEY, version)
  } catch (e) {}
}

/**
 * 返回需要弹窗的更新内容：{ version, entries: [...] }，没有则返回 null。
 * entries 是「上次已读版本」之后的所有条目，最新在前，最多 MAX_ENTRIES 条。
 */
function pendingUpdate() {
  var current = currentVersion()
  if (!current) return null

  var seen = getSeenVersion()
  if (seen === current) return null

  // 首次使用或从未真正确认过更新说明：显示最新一条，不能预先写已读。
  if (!seen) return { version: current, entries: CHANGELOG.slice(0, 1) }

  // 找到上次已读版本的位置；找不到（例如从更高版本回退）只提示最新一条。
  var idx = -1
  for (var i = 0; i < CHANGELOG.length; i++) {
    if (CHANGELOG[i].version === seen) {
      idx = i
      break
    }
  }

  if (idx === 0) {
    markSeen()
    return null
  }

  var entries = idx > 0 ? CHANGELOG.slice(0, idx) : CHANGELOG.slice(0, 1)
  if (entries.length > MAX_ENTRIES) entries = entries.slice(0, MAX_ENTRIES)

  return { version: current, entries: entries }
}

module.exports = {
  currentVersion: currentVersion,
  getSeenVersion: getSeenVersion,
  markSeen: markSeen,
  pendingUpdate: pendingUpdate,
}
