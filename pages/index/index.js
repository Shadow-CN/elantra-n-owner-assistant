var themeUtil = require('../../utils/theme')
var shareUtil = require('../../utils/share')
var versionUtil = require('../../utils/version')

Page({
  data: {
    navBg: '#FFFFFF',
    navColor: 'black',
    themeMode: 'auto',
    pageStyle: '',
    changelog: null,
    changelogVisible: false,
  },

  onLoad() {
    shareUtil.enableShareMenu()
    this._applyTheme()
    this._checkVersion()
  },

  onShow() {
    this._applyTheme()
  },

  _applyTheme() {
    var app = getApp()
    var mode = app.globalData.themeMode || 'auto'
    var dark = themeUtil.isDarkEffective(mode)
    var nav = themeUtil.navColors(dark)
    this.setData({
      themeMode: mode,
      pageStyle: themeUtil.getPageStyle(mode),
      navBg: nav.navBg,
      navColor: nav.navColor,
    })
  },

  onThemeToggle() {
    var app = getApp()
    var newMode = themeUtil.nextMode(app.globalData.themeMode || 'auto')
    app.globalData.themeMode = newMode
    themeUtil.saveMode(newMode)
    this._applyTheme()
  },

  onOpenObdTool() {
    wx.navigateTo({ url: '/pages/filter/filter' })
  },

  onOpenKnowledge() {
    wx.navigateTo({ url: '/packages/knowledge/knowledge/knowledge' })
  },

  onOpenTools() {
    wx.navigateTo({ url: '/pages/tools/tools' })
  },

  onOpenLaps() {
    wx.navigateTo({ url: '/pages/laps/laps' })
  },

  onOpenGoods() {
    wx.navigateTo({ url: '/pages/goods/goods' })
  },

  // 版本变化时弹一次更新说明，点「知道了」后记录为已读。
  _checkVersion() {
    var update = versionUtil.pendingUpdate()
    if (!update) return
    this.setData({ changelog: update, changelogVisible: true })
  },

  onChangelogClose() {
    versionUtil.markSeen()
    this.setData({ changelogVisible: false })
  },

  // 阻止点弹窗本体时冒泡到遮罩，避免误关。
  onChangelogBodyTap() {},

  onShareAppMessage() {
    return shareUtil.appMessage('index')
  },

  onShareTimeline() {
    return shareUtil.timeline('index')
  },
})
