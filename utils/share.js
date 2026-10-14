var DEFAULT_SHARE = {
  title: 'Elantra N 车主工具箱',
  path: '/pages/index/index',
}

var PAGE_SHARES = {
  index: DEFAULT_SHARE,
  knowledge: {
    title: 'Elantra N 维护知识库',
    path: '/pages/knowledge/knowledge',
  },
  tire: {
    title: 'Elantra N 胎压换算器',
    path: '/pages/tire/tire',
  },
  filter: {
    title: 'Elantra N OBD 参数配置',
    path: '/pages/filter/filter',
  },
  params: {
    title: 'Elantra N OBD 参数列表',
    path: '/pages/params/params',
  },
  export: {
    title: 'Elantra N OBD 配置导出',
    path: '/pages/export/export',
  },
  goods: {
    title: '车友好物 · 联系方式',
    path: '/pages/goods/goods',
  },
}

function getConfig(pageKey) {
  return PAGE_SHARES[pageKey] || DEFAULT_SHARE
}

function enableShareMenu() {
  if (typeof wx === 'undefined' || typeof wx.showShareMenu !== 'function') return
  try {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
  } catch (e) {
    console.warn('[share] showShareMenu failed:', e)
  }
}

function appMessage(pageKey) {
  var config = getConfig(pageKey)
  return {
    title: config.title,
    path: config.path,
  }
}

function timeline(pageKey) {
  var config = getConfig(pageKey)
  return {
    title: config.title,
    query: '',
  }
}

module.exports = {
  enableShareMenu: enableShareMenu,
  appMessage: appMessage,
  timeline: timeline,
}
