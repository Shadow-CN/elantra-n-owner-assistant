// app.js
var themeUtil = require('./utils/theme')

App({
  onLaunch() {
    var mode = themeUtil.loadMode()
    this.globalData.themeMode = mode

    // Use the new API to get system theme (avoids deprecated wx.getSystemInfoSync)
    try {
      var info = wx.getAppBaseInfo()
      this.globalData.systemTheme = info.theme || 'light'
    } catch (e) {
      this.globalData.systemTheme = 'light'
    }

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
  globalData: {
    themeMode: 'auto',   // 'auto' | 'dark' | 'light'
    systemTheme: 'light',
    filterEcu: '',
    filterType: '',
    selectedIds: [],
  }
})
