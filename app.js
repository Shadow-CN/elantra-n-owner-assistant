// app.js
var themeUtil = require('./utils/theme')

App({
  onLaunch() {
    if (wx.cloud) wx.cloud.init({ env: 'hn-owner-asst-d7gufu33n85700993', traceUser: true })
    var mode = themeUtil.loadMode()
    this.globalData.themeMode = mode

    // Use the new API to get system theme (avoids deprecated wx.getSystemInfoSync)
    try {
      var info = wx.getAppBaseInfo()
      this.globalData.systemTheme = info.theme || 'light'
    } catch (e) {
      this.globalData.systemTheme = 'light'
    }

    this._watchUpdate()

    // Listen for system theme changes; re-apply theme on current page if in auto mode
    wx.onThemeChange(function(res) {
      var app = getApp()
      app.globalData.systemTheme = res.theme
      var pages = getCurrentPages()
      var cur = pages[pages.length - 1]
      if (cur && typeof cur._applyTheme === 'function') {
        cur._applyTheme()
      }
    })
  },

  /**
   * 新版小程序下载完成后提示重启。
   * 重启后进入任一带导航栏的页面，更新说明组件会检查是否有未读内容。
   */
  _watchUpdate() {
    if (typeof wx.getUpdateManager !== 'function') return
    var manager = wx.getUpdateManager()

    manager.onUpdateReady(function() {
      wx.showModal({
        title: '有新版本',
        content: '新版本已下载完成，重启小程序后生效，重启时会显示本次更新内容。',
        confirmText: '立即重启',
        cancelText: '稍后',
        success: function(res) {
          if (res.confirm) manager.applyUpdate()
        },
      })
    })

    manager.onUpdateFailed(function() {
      wx.showModal({
        title: '更新失败',
        content: '新版本下载失败，可稍后重新打开小程序，或在微信里删除小程序后重新搜索。',
        showCancel: false,
      })
    })
  },

  globalData: {
    themeMode: 'auto',   // 'auto' | 'dark' | 'light'
    systemTheme: 'light',
    filterEcu: '',
    filterType: '',
    selectedIds: [],
  }
})
