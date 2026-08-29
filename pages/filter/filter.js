// pages/filter/filter.js
const { ECU_GROUPS, getEcuCategory } = require('../../utils/ecuCategories')
const { PARAM_TYPES } = require('../../utils/paramTypes')
const { getEcuCounts, getTypeCounts } = require('../../utils/pidData')

Page({
  data: {
    ecuGroups: [],      // [{ group, label, count, selected }]
    paramTypes: [],     // [{ type, label, count, selected }]
    selectedEcu: '',    // '' means all
    selectedType: '',   // '' means all
    totalCount: 0,      // total matching params under current filter
    selectedCount: 0,   // already-selected params count (from app global)
  },

  onLoad() {
    this._buildFilterData()
  },

  onShow() {
    // Refresh selected count when returning from params page
    const app = getApp()
    this.setData({ selectedCount: app.globalData.selectedIds.length })
  },

  _buildFilterData() {
    const ecuCounts = getEcuCounts()
    const typeCounts = getTypeCounts(this.data.selectedEcu)

    // Restore filter state from app global
    const app = getApp()
    const savedEcu = app.globalData.filterEcu || ''
    const savedType = app.globalData.filterType || ''

    // Build ECU group list, only include groups that have params
    const ecuGroups = ECU_GROUPS
      .filter(function(g) { return ecuCounts[g.group] > 0 })
      .map(function(g) {
        return {
          group: g.group,
          label: g.label,
          count: ecuCounts[g.group] || 0,
          selected: g.group === savedEcu,
        }
      })

    // Build param type list, counts depend on current ECU filter
    const paramTypes = PARAM_TYPES
      .filter(function(t) { return typeCounts[t.type] > 0 })
      .map(function(t) {
        return {
          type: t.type,
          label: t.label,
          count: typeCounts[t.type] || 0,
          selected: t.type === savedType,
        }
      })

    const totalCount = this._calcTotalCount(savedEcu, savedType, ecuCounts, typeCounts)

    this.setData({
      ecuGroups,
      paramTypes,
      selectedEcu: savedEcu,
      selectedType: savedType,
      totalCount,
      selectedCount: app.globalData.selectedIds.length,
    })
  },

  // Calculate how many params match current ECU + type filter
  _calcTotalCount(ecuGroup, paramType, ecuCounts, typeCounts) {
    const { filterPids } = require('../../utils/pidData')
    return filterPids(ecuGroup, paramType).length
  },

  onEcuTap(e) {
    const group = e.currentTarget.dataset.group
    // Toggle: tap same group again to deselect (back to "all")
    const newEcu = this.data.selectedEcu === group ? '' : group

    const app = getApp()
    app.globalData.filterEcu = newEcu
    app.globalData.filterType = ''  // Reset type filter when ECU changes

    // Update ECU selected state
    const ecuGroups = this.data.ecuGroups.map(function(g) {
      return Object.assign({}, g, { selected: g.group === newEcu })
    })

    // Recompute type counts for new ECU filter
    const typeCounts = getTypeCounts(newEcu)
    const paramTypes = PARAM_TYPES
      .filter(function(t) { return typeCounts[t.type] > 0 })
      .map(function(t) {
        return {
          type: t.type,
          label: t.label,
          count: typeCounts[t.type] || 0,
          selected: false,
        }
      })

    const { filterPids } = require('../../utils/pidData')
    const totalCount = filterPids(newEcu, '').length

    this.setData({
      ecuGroups,
      paramTypes,
      selectedEcu: newEcu,
      selectedType: '',
      totalCount,
    })
  },

  onTypeTap(e) {
    const type = e.currentTarget.dataset.type
    const newType = this.data.selectedType === type ? '' : type

    const app = getApp()
    app.globalData.filterType = newType

    const paramTypes = this.data.paramTypes.map(function(t) {
      return Object.assign({}, t, { selected: t.type === newType })
    })

    const { filterPids } = require('../../utils/pidData')
    const totalCount = filterPids(this.data.selectedEcu, newType).length

    this.setData({
      paramTypes,
      selectedType: newType,
      totalCount,
    })
  },

  onViewParams() {
    wx.navigateTo({ url: '/pages/params/params' })
  },

  onViewSelected() {
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '尚未选择任何参数', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/export/export' })
  },
})
