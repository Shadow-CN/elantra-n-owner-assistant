var shareUtil = require('../../utils/share')

Page({
  data: {},

  onLoad() {
    shareUtil.enableShareMenu()
  },

  onShareAppMessage() {
    return shareUtil.appMessage('knowledge2')
  },

  onShareTimeline() {
    return shareUtil.timeline('knowledge2')
  },
})
