// app.js
App({
  onLaunch() {},
  globalData: {
    // 当前筛选条件
    filterEcu: '',       // 选中的 ECU 分组 key，空字符串表示全部
    filterType: '',      // 选中的参数类型 key，空字符串表示全部
    // 用户已选中的参数 id 集合 (Set 会被序列化成 Array 存储)
    selectedIds: [],
  }
})
