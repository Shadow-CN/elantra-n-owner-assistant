// pages/params/params.js
var themeUtil = require('../../utils/theme')
var shareUtil = require('../../utils/share')
var { filterPids, getPidsByIds, getCartPids } = require('../../utils/pidData')
var { ECU_GROUPS } = require('../../utils/ecuCategories')
var { PARAM_TYPES } = require('../../utils/paramTypes')

// Max number of params a user can select at once
const MAX_SELECT = 100

Page({
  data: {
    pids: [],
    selectedCount: 0,
    totalCount: 0,
    allChecked: false,
    filterEcuLabel: '全部',
    filterTypeLabel: '全部',
    cartOpen: false,
    cartPids: [],
    cartCount: 0,
    navBg: '#FFFFFF',
    navColor: 'black',
    themeMode: 'auto',
    pageStyle: '',
  },

  onLoad() {
    shareUtil.enableShareMenu()
    this._loadList()
  },

  onShow() {
    this._applyTheme()
    this._syncChecked()
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
    this._refreshCart()
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
    this._refreshCart()
  },

  onItemTap(e) {
    const index = e.currentTarget.dataset.index
    const pid = this.data.pids[index]
    if (!pid) return

    const newChecked = !pid.checked

    if (newChecked && this.data.cartCount >= MAX_SELECT) {
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
    if (allChecked) {
      const currentIds = new Set(this.data.pids.map(function(p) { return p.id }))
      const kept = (getApp().globalData.selectedIds || []).filter(function(id) {
        return !currentIds.has(id)
      }).length
      if (kept + this.data.totalCount > MAX_SELECT) {
        wx.showToast({ title: `超过 ${MAX_SELECT} 个，请缩小筛选范围`, icon: 'none' })
        return
      }
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
    this._refreshCart()
  },

  _refreshCart(open) {
    var ids = getApp().globalData.selectedIds || []
    var cartPids = getCartPids(ids)
    var cartOpen = cartPids.length === 0 ? false : this.data.cartOpen
    if (open === true && cartPids.length > 0) cartOpen = true
    if (open === false) cartOpen = false
    this.setData({
      cartPids: cartPids,
      cartCount: cartPids.length,
      cartOpen: cartOpen,
    })
  },

  onToggleCart() {
    if (this.data.cartOpen) {
      this.setData({ cartOpen: false })
      return
    }
    var cartPids = getCartPids(getApp().globalData.selectedIds || [])
    if (cartPids.length === 0) {
      wx.showToast({ title: '还没有选择参数', icon: 'none' })
      return
    }
    this.setData({
      cartPids: cartPids,
      cartCount: cartPids.length,
      cartOpen: true,
    })
  },

  onRemoveCartItem(e) {
    var id = String(e.currentTarget.dataset.id)
    getApp().globalData.selectedIds = (getApp().globalData.selectedIds || []).filter(function(x) {
      return String(x) !== id
    })
    this._syncChecked()
    this._refreshCart(true)
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
        self._syncChecked()
      },
    })
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
  onShareAppMessage() {
    return shareUtil.appMessage('params')
  },

  onShareTimeline() {
    return shareUtil.timeline('params')
  },
})
