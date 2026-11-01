// Keep existing shared links working after moving the reader to a subpackage.
Page({
  onLoad(options) {
    var model = options && options.model === '5n' ? '5n' : 'elantra'
    wx.redirectTo({ url: '/packages/knowledge/knowledge/knowledge?model=' + model })
  },
})
