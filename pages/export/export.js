// pages/export/export.js
var themeUtil = require('../../utils/theme')
var shareUtil = require('../../utils/share')
var pidData = require('../../utils/pidData')
var carScannerExporter = require('../../utils/carScannerExporter')
var fileHelper = require('../../utils/fileHelper')

Page({
  data: {
    selectedCount: 0,
    selectedPids: [],
    cartOpen: false,
    generating: false,
    lastResult: null,
    errorMsg: '',
    navBg: '#FFFFFF',
    navColor: 'black',
    themeMode: 'auto',
    pageStyle: '',
  },

  onLoad() {
    shareUtil.enableShareMenu()
    this._loadSelected()
  },

  onShow() {
    this._applyTheme()
    this._loadSelected()
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

  _loadSelected(resetResult) {
    var app = getApp()
    var ids = app.globalData.selectedIds || []
    var pids = pidData.getPidsByIds(ids)
    var patch = {
      selectedCount: pids.length,
      selectedPids: pids,
      cartOpen: pids.length === 0 ? false : this.data.cartOpen,
    }
    if (resetResult !== false) {
      patch.lastResult = null
      patch.errorMsg = ''
    }
    this.setData(patch)
  },

  onToggleCart() {
    if (!this.data.cartOpen && this.data.selectedCount === 0) {
      wx.showToast({ title: '还没有选择参数', icon: 'none' })
      return
    }
    this.setData({ cartOpen: !this.data.cartOpen })
  },

  onRemoveCartItem(e) {
    var id = e.currentTarget.dataset.id
    var app = getApp()
    app.globalData.selectedIds = (app.globalData.selectedIds || []).filter(function(x) {
      return x !== id
    })
    this._loadSelected(false)
  },

  onClearCart() {
    var self = this
    wx.showModal({
      title: '清空已选',
      content: '确定要清空所有已选参数吗？',
      success: function(res) {
        if (!res.confirm) return
        getApp().globalData.selectedIds = []
        self.setData({ cartOpen: false })
        self._loadSelected(false)
      },
    })
  },

  onGenerateCarScanner() {
    var pids = this.data.selectedPids
    if (pids.length === 0) {
      wx.showToast({ title: '请先选择参数', icon: 'none' })
      return
    }

    this.setData({ generating: true, errorMsg: '', lastResult: null })

    // Generate CSP content (synchronous, may take a moment for large sets)
    var result
    try {
      result = carScannerExporter.generateCsp(pids)
    } catch (e) {
      console.error('[export] generateCsp error:', e)
      this.setData({
        generating: false,
        errorMsg: '生成失败: ' + (e.message || String(e)),
      })
      return
    }

    if (result.total === 0) {
      this.setData({
        generating: false,
        errorMsg: '所选参数均无法转换为 Car Scanner 格式（可能全为不支持的位字段）',
        lastResult: result,
      })
      return
    }

    var fileName = 'custompids.csp'
    var self = this

    fileHelper.saveAndShare(
      fileName,
      result.content,
      function(info) {
        self.setData({
          generating: false,
          lastResult: result,
        })

        if (info.shareSkipped) {
          // Share sheet not available (devtools / unsupported env).
          // File is already written to USER_DATA_PATH.
          wx.showModal({
            title: '文件已生成',
            content: '已生成 ' + result.total + ' 个参数。\n' +
              '分享界面在当前环境不可用（如在真机上测试可正常弹出分享）。\n' +
              '文件路径：' + info.filePath,
            showCancel: false,
          })
        } else if (result.skipped > 0) {
          wx.showModal({
            title: '导出完成',
            content: '已生成 ' + result.total + ' 个参数。\n' +
              result.skipped + ' 个参数无法转换（公式不支持），已跳过。',
            showCancel: false,
          })
        } else {
          wx.showToast({ title: '导出成功 ' + result.total + ' 个', icon: 'success' })
        }
      },
      function(err) {
        self.setData({
          generating: false,
          errorMsg: err.message || '导出失败',
        })
        wx.showModal({
          title: '导出失败',
          content: err.message || '请检查存储权限',
          showCancel: false,
        })
      }
    )
  },

  onShowLufiInfo() {
    wx.showModal({
      title: 'LUFI XF 支持',
      content: 'LUFI .INI 是二进制模板改写格式，必须基于官方可导入模板生成。当前项目已加入转换规范文档，待补充官方模板后再开放生成。',
      showCancel: false,
    })
  },

  onClearSelection() {
    wx.showModal({
      title: '清空选择',
      content: '确定要清空所有已选参数吗？',
      success: function(res) {
        if (res.confirm) {
          var app = getApp()
          app.globalData.selectedIds = []
          wx.navigateBack()
        }
      }
    })
  },

  onGoParams() {
    wx.navigateBack()
  },
  onShareAppMessage() {
    return shareUtil.appMessage('export')
  },

  onShareTimeline() {
    return shareUtil.timeline('export')
  },
})
