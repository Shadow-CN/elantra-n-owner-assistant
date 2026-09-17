Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      // 显示隐藏的时候opacity动画效果
      type: Boolean,
      value: true
    },
    show: {
      // 显示隐藏导航，隐藏的时候navigation-bar的高度占位还在
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    // back为true的时候，返回的页面深度
    delta: {
      type: Number,
      value: 1
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: ''
  },
  lifetimes: {
    attached() {
      const rect = wx.getMenuButtonBoundingClientRect()
      this._applySystemLayout(rect)
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _getSystemLayoutInfo() {
      if (typeof wx.getWindowInfo === 'function' && typeof wx.getDeviceInfo === 'function') {
        var windowInfo = wx.getWindowInfo()
        var deviceInfo = wx.getDeviceInfo()
        return {
          platform: deviceInfo.platform || '',
          windowWidth: windowInfo.windowWidth,
          safeArea: windowInfo.safeArea || { top: 0 },
        }
      }

      try {
        return wx.getSystemInfoSync()
      } catch (e) {
        return {
          platform: '',
          windowWidth: 0,
          safeArea: { top: 0 },
        }
      }
    },

    _applySystemLayout(rect) {
      var res = this._getSystemLayoutInfo()
      var safeAreaTop = (res.safeArea && res.safeArea.top) || 0
      var windowWidth = res.windowWidth || rect.right || 0
      var rightWidth = windowWidth - rect.left
      var platform = (res.platform || '').toLowerCase()
      var isAndroid = platform === 'android'
      var isDevtools = platform === 'devtools'
      var useExplicitSafeArea = isDevtools || isAndroid

      this.setData({
        ios: !isAndroid,
        innerPaddingRight: `padding-right: ${rightWidth}px`,
        leftWidth: `width: ${rightWidth}px`,
        rightInset: `right: ${rightWidth}px`,
        safeAreaTop: useExplicitSafeArea ? `height: calc(var(--height) + ${safeAreaTop}px); padding-top: ${safeAreaTop}px` : ``,
        navContentStyle: useExplicitSafeArea
          ? `top: ${safeAreaTop}px; height: var(--height);`
          : `top: env(safe-area-inset-top); height: var(--height);`,
      })
    },

    _showChange(show) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        displayStyle = `opacity: ${
          show ? '1' : '0'
        };transition:opacity 0.5s;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({
        displayStyle
      })
    },
    back() {
      const data = this.data
      if (data.delta) {
        wx.navigateBack({
          delta: data.delta
        })
      }
      this.triggerEvent('back', { delta: data.delta }, {})
    }
  },
})
