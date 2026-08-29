// pages/params/params.js
const { filterPids, getPidsByIds } = require('../../utils/pidData')
const { ECU_GROUPS } = require('../../utils/ecuCategories')
const { PARAM_TYPES } = require('../../utils/paramTypes')

// Max number of params a user can select at once
const MAX_SELECT = 100

Page({
  data: {
    pids: [],             // displayed (filtered) list with 'checked' field
    selectedCount: 0,
    totalCount: 0,
    allChecked: false,
    filterEcuLabel: '全部',
    filterTypeLabel: '全部',
  },

  onLoad() {
    this._loadList()
  },

  onShow() {
    // If returning from export, re-sync checked state
    this._syncChecked()
  },

  _loadList() {
    const app = getApp()
    const ecuGroup = app.globalData.filterEcu || ''
    const paramType = app.globalData.filterType || ''
    const selectedIds = new Set(app.globalData.selectedIds || [])

    const pids = filterPids(ecuGroup, paramType)

    // Add 'checked' field for UI binding
    const pidList = pids.map(function(pid) {
      return Object.assign({}, pid, { checked: selectedIds.has(pid.id) })
    })

    // Build filter label strings for header display
    const ecuLabel = ecuGroup
      ? (ECU_GROUPS.find(function(g) { return g.group === ecuGroup }) || {}).label || ecuGroup
      : '全部'
    const typeLabel = paramType
      ? (PARAM_TYPES.find(function(t) { return t.type === paramType }) || {}).label || paramType
      : '全部'

    const selectedCount = pidList.filter(function(p) { return p.checked }).length

    this.setData({
      pids: pidList,
      totalCount: pidList.length,
      selectedCount,
      allChecked: pidList.length > 0 && selectedCount === pidList.length,
      filterEcuLabel: ecuLabel,
      filterTypeLabel: typeLabel,
    })
  },

  _syncChecked() {
    const app = getApp()
    const selectedIds = new Set(app.globalData.selectedIds || [])
    const pids = this.data.pids.map(function(pid) {
      return Object.assign({}, pid, { checked: selectedIds.has(pid.id) })
    })
    const selectedCount = pids.filter(function(p) { return p.checked }).length
    this.setData({
      pids,
      selectedCount,
      allChecked: pids.length > 0 && selectedCount === pids.length,
    })
  },

  onItemTap(e) {
    const index = e.currentTarget.dataset.index
    const pid = this.data.pids[index]
    if (!pid) return

    const newChecked = !pid.checked

    // Enforce max selection limit
    if (newChecked && this.data.selectedCount >= MAX_SELECT) {
      wx.showToast({ title: `最多选择 ${MAX_SELECT} 个参数`, icon: 'none' })
      return
    }

    // Update item in list
    const key = `pids[${index}].checked`
    this.setData({ [key]: newChecked })

    // Sync to global state
    this._persistSelection()
  },

  onSelectAll() {
    const allChecked = !this.data.allChecked
    if (allChecked && this.data.totalCount > MAX_SELECT) {
      wx.showToast({ title: `超过 ${MAX_SELECT} 个，请缩小筛选范围`, icon: 'none' })
      return
    }
    const pids = this.data.pids.map(function(pid) {
      return Object.assign({}, pid, { checked: allChecked })
    })
    const selectedCount = allChecked ? pids.length : 0
    this.setData({ pids, allChecked, selectedCount })
    this._persistSelection()
  },

  onClearAll() {
    const pids = this.data.pids.map(function(pid) {
      return Object.assign({}, pid, { checked: false })
    })
    this.setData({ pids, allChecked: false, selectedCount: 0 })
    this._persistSelection()
  },

  // Write selected IDs back to app global state.
  // Merges: keeps IDs that were selected outside current filter, plus current page's selections.
  _persistSelection() {
    const app = getApp()
    const prevIds = new Set(app.globalData.selectedIds || [])
    const currentIds = new Set(this.data.pids.map(function(p) { return p.id }))

    // Keep: IDs not in current filter (selected elsewhere) + newly checked IDs
    const kept = Array.from(prevIds).filter(function(id) { return !currentIds.has(id) })
    const selected = this.data.pids
      .filter(function(p) { return p.checked })
      .map(function(p) { return p.id })

    app.globalData.selectedIds = kept.concat(selected)

    // Recount within current filter
    const selectedCount = this.data.pids.filter(function(p) { return p.checked }).length
    const allChecked = this.data.pids.length > 0 && selectedCount === this.data.pids.length
    this.setData({ selectedCount, allChecked })
  },

  onGoExport() {
    const app = getApp()
    if (app.globalData.selectedIds.length === 0) {
      wx.showToast({ title: '请先选择参数', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/export/export' })
  },

  onGoFilter() {
    wx.navigateBack()
  },
})
