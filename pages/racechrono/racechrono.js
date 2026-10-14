var theme = require('../../utils/theme')
var pidData = require('../../utils/pidData')
var exporter = require('../../utils/raceChronoExporter')
var fileHelper = require('../../utils/fileHelper')
var PAGE_SIZE = 1

Page({
  data: {
    selectedCount: 0, query: '', entries: [], errors: [],
    total: 0, page: 1, pageCount: 1, scrollTop: 0,
    navBg: '#FFFFFF', navColor: 'black', themeMode: 'auto', pageStyle: '',
  },

  onLoad() {
    this._selectedIds = (getApp().globalData.selectedIds || []).slice()
    this.setData({ selectedCount: this._selectedIds.length })
    this._reload()
  },

  onShow() { this._applyTheme() },

  _applyTheme() {
    var mode = getApp().globalData.themeMode || 'auto'
    var colors = theme.navColors(theme.isDarkEffective(mode))
    this.setData({ themeMode: mode, pageStyle: theme.getPageStyle(mode) + ';height:100vh;display:flex;flex-direction:column;', navBg: colors.navBg, navColor: colors.navColor })
  },

  onThemeToggle() {
    var mode = theme.nextMode(getApp().globalData.themeMode || 'auto')
    getApp().globalData.themeMode = mode
    theme.saveMode(mode)
    this._applyTheme()
  },

  _reload() {
    var pids = pidData.getPidsByIds(this._selectedIds)
    this._result = exporter.generate(pids)
    this._filter()
  },

  _filter() {
    var query = this.data.query.trim().toLowerCase()
    this._visible = this._result.entries.filter(function(entry) {
      return !query || [entry.id, entry.name, entry.nameEn, entry.ecu, entry.values[4]].join(' ').toLowerCase().indexOf(query) !== -1
    })
    this.setData({ total: this._visible.length, pageCount: Math.max(1, Math.ceil(this._visible.length / PAGE_SIZE)), errors: this._result.errors })
    this._showPage(1)
  },

  _showPage(page) {
    this.setData({ page: page, entries: this._visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), scrollTop: this.data.scrollTop === 0 ? 1 : 0 })
  },

  onSearch(e) { this.setData({ query: e.detail.value }); this._filter() },
  onPrevious() { if (this.data.page > 1) this._showPage(this.data.page - 1) },
  onNext() { if (this.data.page < this.data.pageCount) this._showPage(this.data.page + 1) },

  onCopy(e) {
    var entry = this.data.entries[e.currentTarget.dataset.entry]
    var field = entry && entry.fields[e.currentTarget.dataset.field]
    if (!field) return
    wx.setClipboardData({
      data: field.copyValue,
      success: function() { wx.showToast({ title: field.copyValue ? '已复制' : '已复制空值，RC 中留空', icon: 'none' }) },
      fail: function() { wx.showToast({ title: field.copyValue ? '复制失败，请重试' : '此项在 RC 中留空', icon: 'none' }) },
    })
  },

  onShareFile() {
    if (!this._result.total) { wx.showToast({ title: '没有可导出的参数', icon: 'none' }); return }
    fileHelper.saveAndShare('racechrono_cn7.md', exporter.toMarkdown(this._result), function(info) {
      if (info.shareSkipped) wx.showModal({ title: '配置清单已生成', content: info.filePath, showCancel: false })
    }, function(err) { wx.showToast({ title: err.message, icon: 'none' }) })
  },
})
