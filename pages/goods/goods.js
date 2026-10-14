var themeUtil = require('../../utils/theme')
var shareUtil = require('../../utils/share')
var goods = require('../../data/friendGoods')

Page({
  data: {
    goods: goods,
    navBg: '#FFFFFF', navColor: 'black', themeMode: 'auto', pageStyle: '',
  },
  onLoad() { shareUtil.enableShareMenu(); this._applyTheme() },
  onShow() { this._applyTheme() },
  _applyTheme() {
    var mode = getApp().globalData.themeMode || 'auto'
    var dark = themeUtil.isDarkEffective(mode)
    var nav = themeUtil.navColors(dark)
    this.setData({
      themeMode: mode, navBg: nav.navBg, navColor: nav.navColor,
      pageStyle: themeUtil.getPageStyle(mode) + ';--goods-note:' + (dark ? '#A8ADB5' : '#667085'),
    })
  },
  onThemeToggle() {
    var app = getApp()
    app.globalData.themeMode = themeUtil.nextMode(app.globalData.themeMode || 'auto')
    themeUtil.saveMode(app.globalData.themeMode)
    this._applyTheme()
  },
  onCopyWechat(e) {
    var item = goods.find(function(item) { return item.id === e.currentTarget.dataset.id })
    if (!item) return
    wx.setClipboardData({
      data: item.wechat,
      success: function() { wx.showToast({ title: '微信号已复制', icon: 'success' }) },
      fail: function() { wx.showToast({ title: '复制失败，请重试', icon: 'none' }) },
    })
  },
  onShareAppMessage() { return shareUtil.appMessage('goods') },
  onShareTimeline() { return shareUtil.timeline('goods') },
})
