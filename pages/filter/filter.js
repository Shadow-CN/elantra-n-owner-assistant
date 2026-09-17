// pages/filter/filter.js
var themeUtil = require('../../utils/theme')
var shareUtil = require('../../utils/share')
var { ECU_GROUPS } = require('../../utils/ecuCategories')
var { PARAM_TYPES } = require('../../utils/paramTypes')
var { filterPids, getEcuCounts, getTypeCounts, getCartPids } = require('../../utils/pidData')

var ALL = '_all'

Page({
  data: {
    ecuGroups: [],
    paramTypes: [],
    selectedEcu: '',
    selectedType: '',
    totalCount: 0,
    selectedCount: 0,
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
    this._applyTheme()
    this._buildFilterData()
  },

  onShow() {
    this._applyTheme()
    this._refreshCart()
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

  _buildFilterData() {
    var app = getApp()
    var savedEcu = app.globalData.filterEcu || ''
    var savedType = app.globalData.filterType || ''

    var ecuCounts = getEcuCounts()
    var typeCounts = getTypeCounts(savedEcu)

    var ecuGroups = ECU_GROUPS
      .filter(function(g) { return ecuCounts[g.group] > 0 })
      .map(function(g) {
        return {
          group: g.group,
          label: g.label,
          count: ecuCounts[g.group] || 0,
          selected: g.group === savedEcu,
        }
      })

    var paramTypes = PARAM_TYPES
      .filter(function(t) { return typeCounts[t.type] > 0 })
      .map(function(t) {
        return {
          type: t.type,
          label: t.label,
          count: typeCounts[t.type] || 0,
          selected: t.type === savedType,
        }
      })

    this.setData({
      ecuGroups: ecuGroups,
      paramTypes: paramTypes,
      selectedEcu: savedEcu,
      selectedType: savedType,
      totalCount: filterPids(savedEcu, savedType).length,
    })
  },

  onEcuTap(e) {
    var raw = e.currentTarget.dataset.group
    var tapped = (raw === ALL || raw === undefined) ? '' : raw
    var newEcu = this.data.selectedEcu === tapped ? '' : tapped

    var app = getApp()
    app.globalData.filterEcu = newEcu
    app.globalData.filterType = ''

    var ecuGroups = this.data.ecuGroups.map(function(g) {
      return Object.assign({}, g, { selected: g.group === newEcu })
    })

    var typeCounts = getTypeCounts(newEcu)
    var paramTypes = PARAM_TYPES
      .filter(function(t) { return typeCounts[t.type] > 0 })
      .map(function(t) {
        return { type: t.type, label: t.label, count: typeCounts[t.type] || 0, selected: false }
      })

    this.setData({
      ecuGroups: ecuGroups,
      paramTypes: paramTypes,
      selectedEcu: newEcu,
      selectedType: '',
      totalCount: filterPids(newEcu, '').length,
    })
  },

  onTypeTap(e) {
    var raw = e.currentTarget.dataset.type
    var tapped = (raw === ALL || raw === undefined) ? '' : raw
    var newType = this.data.selectedType === tapped ? '' : tapped

    var app = getApp()
    app.globalData.filterType = newType

    var paramTypes = this.data.paramTypes.map(function(t) {
      return Object.assign({}, t, { selected: t.type === newType })
    })

    this.setData({
      paramTypes: paramTypes,
      selectedType: newType,
      totalCount: filterPids(this.data.selectedEcu, newType).length,
    })
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
      selectedCount: cartPids.length,
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
        self._refreshCart()
      },
    })
  },

  onViewParams() {
    wx.navigateTo({ url: '/pages/params/params' })
  },

  onViewSelected() {
    if (this.data.cartCount === 0) {
      wx.showToast({ title: '尚未选择任何参数', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/export/export' })
  },
  onShareAppMessage() {
    return shareUtil.appMessage('filter')
  },

  onShareTimeline() {
    return shareUtil.timeline('filter')
  },
})
