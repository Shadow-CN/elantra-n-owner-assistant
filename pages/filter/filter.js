// pages/filter/filter.js
var themeUtil = require('../../utils/theme')
var shareUtil = require('../../utils/share')
var { ECU_GROUPS } = require('../../utils/ecuCategories')
var { PARAM_TYPES } = require('../../utils/paramTypes')
var { getAllPids, filterPids, getEcuCounts, getTypeCounts, getCartPids } = require('../../utils/pidData')

var ALL = '_all'
var MAX_SELECT = 100
var SEARCH_LIMIT = 20

Page({
  data: {
    ecuGroups: [],
    paramTypes: [],
    selectedEcu: '',
    selectedType: '',
    totalCount: 0,
    selectedCount: 0,
    searchQuery: '',
    searchResults: [],
    searchTotal: 0,
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
    this._refreshSearchResults()
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

  _formatSearchPid(pid, selectedIds) {
    return {
      id: String(pid.id),
      display_name: pid.name_cn || pid.name_en || '',
      name_cn: pid.name_cn || '',
      name_en: pid.name_en || '',
      ecu_label: pid.ecu_label || '',
      unit: pid.unit || '',
      checked: selectedIds.has(String(pid.id)),
    }
  },

  _searchPids(query) {
    var q = (query || '').trim().toLowerCase()
    if (!q) {
      this.setData({ searchResults: [], searchTotal: 0 })
      return
    }

    var selectedIds = new Set((getApp().globalData.selectedIds || []).map(function(id) {
      return String(id)
    }))
    var matches = []
    var total = 0
    var all = getAllPids()

    for (var i = 0; i < all.length; i++) {
      var pid = all[i]
      var haystack = [
        pid.id,
        pid.name_cn,
        pid.name_en,
        pid.ecu,
        pid.ecu_label,
        pid.unit,
        pid.cmd,
        pid.did,
      ].join(' ').toLowerCase()

      if (haystack.indexOf(q) === -1) continue
      total += 1
      if (matches.length < SEARCH_LIMIT) {
        matches.push(this._formatSearchPid(pid, selectedIds))
      }
    }

    this.setData({
      searchResults: matches,
      searchTotal: total,
    })
  },

  _refreshSearchResults() {
    if (!this.data.searchQuery) return
    this._searchPids(this.data.searchQuery)
  },

  onSearchInput(e) {
    var query = e.detail.value || ''
    this.setData({ searchQuery: query })
    this._searchPids(query)
  },

  onClearSearch() {
    this.setData({
      searchQuery: '',
      searchResults: [],
      searchTotal: 0,
    })
  },

  onToggleSearchPid(e) {
    var id = String(e.currentTarget.dataset.id)
    var app = getApp()
    var selectedIds = (app.globalData.selectedIds || []).map(function(x) {
      return String(x)
    })
    var index = selectedIds.indexOf(id)

    if (index >= 0) {
      selectedIds.splice(index, 1)
    } else {
      if (selectedIds.length >= MAX_SELECT) {
        wx.showToast({ title: '最多选择 ' + MAX_SELECT + ' 个参数', icon: 'none' })
        return
      }
      selectedIds.push(id)
    }

    app.globalData.selectedIds = selectedIds
    this._refreshCart()
    this._refreshSearchResults()
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
