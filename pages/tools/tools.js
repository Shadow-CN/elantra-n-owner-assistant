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
    var mode = getApp().globalData.themeMode || 'auto'
    var nav = themeUtil.navColors(themeUtil.isDarkEffective(mode))
    this.setData({
      themeMode: mode,
      pageStyle: themeUtil.getPageStyle(mode),
      navBg: nav.navBg,
      navColor: nav.navColor,
    })
  },

  onThemeToggle() {
    var app = getApp()
    var mode = themeUtil.nextMode(app.globalData.themeMode || 'auto')
    app.globalData.themeMode = mode
    themeUtil.saveMode(mode)
    this._applyTheme()
  },

  onOpenTire() {
    wx.navigateTo({ url: '/pages/tire/tire' })
  },

  // 轮毂模拟器尚未开发，入口先占位，点击给出提示。
  onOpenWheel() {
    wx.showToast({ title: '轮毂模拟器开发中，敬请期待', icon: 'none' })
  },

  onShareAppMessage() {
    return shareUtil.appMessage('tools')
  },

  onShareTimeline() {
    return shareUtil.timeline('tools')
  },
})
