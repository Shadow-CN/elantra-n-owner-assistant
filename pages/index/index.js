var themeUtil = require('../../utils/theme')
var shareUtil = require('../../utils/share')

Page({
  data: {
    navBg: '#FFFFFF',
    navColor: 'black',
    themeMode: 'auto',
    pageStyle: '',
  },

  onLoad() {
    shareUtil.enableShareMenu()
    this._applyTheme()
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
    wx.navigateTo({ url: '/pages/knowledge/knowledge' })
  },

  onOpenTireTool() {
    wx.navigateTo({ url: '/pages/tire/tire' })
  },

  onShareAppMessage() {
    return shareUtil.appMessage('index')
  },

  onShareTimeline() {
    return shareUtil.timeline('index')
  },
})
