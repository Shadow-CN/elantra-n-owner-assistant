var themeUtil = require('../../utils/theme')
var shareUtil = require('../../utils/share')

Page({
  data: {
    navBg: '#FFFFFF',
    navColor: 'black',
    themeMode: 'auto',
    pageStyle: '',
    psi: '35',
    kpa: '241',
    bar: '2.41',
    quickValues: [32, 33, 35, 36, 37],
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

  onPsi(e) {
    var v = Number(e.detail.value)
    this.setData({
      psi: e.detail.value,
      kpa: isFinite(v) ? (v * 6.894757).toFixed(0) : '',
      bar: isFinite(v) ? (v * 0.06894757).toFixed(2) : '',
    })
  },

  onKpa(e) {
    var v = Number(e.detail.value)
    this.setData({
      kpa: e.detail.value,
      psi: isFinite(v) ? (v / 6.894757).toFixed(1) : '',
      bar: isFinite(v) ? (v / 100).toFixed(2) : '',
    })
  },

  onBar(e) {
    var v = Number(e.detail.value)
    this.setData({
      bar: e.detail.value,
      psi: isFinite(v) ? (v * 14.503774).toFixed(1) : '',
      kpa: isFinite(v) ? (v * 100).toFixed(0) : '',
    })
  },

  onQuickPsi(e) {
    var v = String(e.currentTarget.dataset.value)
    this.onPsi({ detail: { value: v } })
  },

  onShareAppMessage() {
    return shareUtil.appMessage('tire')
  },

  onShareTimeline() {
    return shareUtil.timeline('tire')
  },
})
