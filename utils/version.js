/**
 * version.js — 版本更新提示。
 *
 * 数据来自 data/changelog.js。已读版本存在本地缓存 seenVersion。
 * 只有「上次已读版本」和「当前版本」不一致时才提示，首次安装不提示。
 */

var CHANGELOG = require('../data/changelog')

var STORAGE_KEY = 'seenVersion'
var MAX_ENTRIES = 3

function currentVersion() {
  return CHANGELOG.length ? CHANGELOG[0].version : ''
}

function getSeenVersion() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || ''
  } catch (e) {
    return ''
  }
}

function markSeen() {
  try {
    wx.setStorageSync(STORAGE_KEY, currentVersion())
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

  // 首次安装：不打扰，直接记为已读。
  if (!seen) {
    markSeen()
    return null
  }

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
