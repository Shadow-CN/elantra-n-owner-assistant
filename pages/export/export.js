// pages/export/export.js
var pidData = require('../../utils/pidData')
var carScannerExporter = require('../../utils/carScannerExporter')
var fileHelper = require('../../utils/fileHelper')

Page({
  data: {
    selectedCount: 0,
    selectedPids: [],     // full PID objects for selected IDs
    generating: false,
    lastResult: null,     // { total, skipped, skippedNames }
    errorMsg: '',
  },

  onLoad() {
    this._loadSelected()
  },

  onShow() {
    this._loadSelected()
  },

  _loadSelected() {
    var app = getApp()
    var ids = app.globalData.selectedIds || []
    var pids = pidData.getPidsByIds(ids)

    this.setData({
      selectedCount: pids.length,
      selectedPids: pids,
      lastResult: null,
      errorMsg: '',
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

        if (result.skipped > 0) {
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
})
