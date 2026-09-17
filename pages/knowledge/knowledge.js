var themeUtil = require('../../utils/theme')
var shareUtil = require('../../utils/share')

Page({
  data: {
    navBg: '#FFFFFF', navColor: 'black', themeMode: 'auto', pageStyle: '', query: '', psi: '35', kpa: '241', bar: '2.41',
    contacts: [
      { name: 'VP', role: '排气和改装件', wechat: 'R-35111' },
      { name: '刘玉玺', role: '原厂 / 副厂配件', wechat: 'L17515117183' },
    ],
    sections: [
      { id: '01', title: '配件信息', subtitle: 'PARTS & PART NUMBERS', cards: [
        { title: '空调滤芯', lines: ['原厂 K 97133 L1100', '马勒 LAK1840 / LA1840', '曼牌 CUK21028 / CUK21032', '博世 0986AF4636', '科德宝 CF105 / BL507', '索菲玛 S4514CA1 / MC3294C'] },
        { title: '机油滤芯', lines: ['原厂 K 26300 35505N', '马勒 OC523 · 曼牌 W811/80 / W8054', '博世 0986AF0047 / 0986AF1150', '科德宝 OF014 · 汉格斯特 H13WO1', '索菲玛 S6902R / S6902R1', 'K&N HP1004 · FRAM FPS9688', '斯巴鲁短机滤 15208 AA100'] },
        { title: '火花塞', lines: ['原厂 18857 09085', 'NGK SILZKR8H9G / 94595', '改装参考：ILKR9Q7G / 97312', '改装参考：R2556G-9'] },
        { title: '其他零件', lines: ['空气滤芯 28113 IB000', '改款钥匙 95440 IB500 YPN · 旧款钥匙 95440 IB000', '地毯卡子 84270 F2100 · 前翼子板支架 86551 / 86552 AAAA0', 'G70 高压油泵 35320 2GTA1', '排气垫片 28751 3J000 · 放油螺丝垫片 M14 × 22 × 1.5'] },
        { title: '地毯卡子参考图', lines: ['地毯卡子 84270 F2100'], image: '/en_knowledge/微信图片_20260901145009130_2.jpg' },
        { title: 'NP 滤芯与雨刮器', lines: ['NP 滤芯：每 10,000 km 清理，每 40,000 km 更换', '雨刮器：24″ / 18″，U 型接口', '贵万江 ¥51 / ¥72，PIAA ¥129'] },
      ] },
      { id: '02', title: '机油', subtitle: 'ENGINE OIL · 0W-30', cards: [
        { title: '壳牌 先锋超凡喜力 ECT BBA', lines: ['0W-30 · API SQ · ACEA C3', 'BMW LL-19 FE · MB 229.51', '北京现代 4S 店'] },
        { title: '壳牌 超凡喜力极速闪电版', lines: ['0W-30 · API SP · ACEA C3', 'BMW LL-19 FE · MB 229.51', '途虎养车，¥289.6 / 5L，含曼牌机滤'] },
        { title: '美孚 1 号 ESP', lines: ['0W-30 · API SP · ACEA C3 · MB 229.51', '京东国际，¥39.5 / L'] },
      ] },
      { id: '03', title: '变速箱油', subtitle: 'TRANSMISSION FLUID · DCT', cards: [
        { title: '更换信息', lines: ['BHB0005R · 自动变速器油更换', '工时 3.0h × ¥100 = ¥300', '湿式 DCT 需分别更换润滑冷却与液压控制两种油。'] },
        { title: '原厂件', lines: ['润滑冷却油 04300 2N100 · 液压控制油 04300 2N110', '磁性放油螺丝 00810 17121 · 放油垫片 45323 39000', '加油口螺丝 43121 11000 · 加油垫片 17511 16000', '磁性塞 45324 23100 · 油塞密封垫 21513 23001'] },
        { title: '电脑版', lines: ['韩版 ECU 39160 2G554 · TCU 954A1 2N530', '美版 ECU 39116 2G561 · TCU 954A1 2N541', '中规 ECU 39160 2G558 · TCU 954A1 2N550'] },
      ] },
      { id: '04', title: '行车记录仪', subtitle: 'DASH CAM', cards: [
        { title: '单录推荐', lines: ['70迈 A810 Pro ¥475，仅 2.4G WiFi', '70迈 M800 Pro ¥519，单录综合推荐', '万奇欧 E1 Pro ¥599，带屏幕', '70迈 X800 ¥899，支持 H.265'] },
        { title: '前后双录推荐', lines: ['万奇欧 S1 Pro Max ¥1350，推荐', '威孚 A229 Ultra ¥1650', '双录建议使用 U3 / V30 及以上高速 TF 卡。'] },
      ] },
      { id: '05', title: '紧固扭矩', subtitle: 'TORQUE SPECIFICATIONS', cards: [
        { title: '建议值', lines: ['放油螺丝：34.3–44.1 N·m，建议 40 N·m', '机油滤清器：11.8–15.7 N·m，建议 14 N·m', '轮毂螺母：107.9–127.5 N·m，建议 120 N·m'] },
      ] },
      { id: '06', title: '轮胎性能指南', subtitle: 'PS4S HN · TIRE PRESSURE', cards: [
        { title: '胎压与调整', lines: ['热胎最佳：35–37 PSI / 241–255 kPa / 2.41–2.55 bar', '冷胎起始：32–33 PSI / 220.6–227.5 kPa / 2.21–2.28 bar', '同胎设定：前后同压起步', '转向不足：后轮 +2 PSI；转向过度：前轮 +2 PSI'] },
      ] },
      { id: '07', title: 'CarPlay 解锁升级', subtitle: 'HYUNDAI · KIA OEM HEAD UNIT', cards: [
        { title: '方案 ① 原车 CarPlay 解锁', lines: ['¥800 · U 盘直刷，无需拆机，可逆', '与韩国原厂一致的有线 CarPlay'] },
        { title: '方案 ② 第三方 App 安装', lines: ['¥1380，赠送原车 CarPlay 解锁', '支持原生系统第三方 App；后续免费升级'] },
        { title: '说明', lines: ['当前为有线 CarPlay；网页资料称后续将免费支持无线 CarPlay。', '咨询微信：QUIC443'] },
      ] },
      { id: '08', title: '价目信息', subtitle: 'DEALER PRICING · 含工时', cards: [
        { title: '京现荣华 · 4S 店', lines: ['前刹车皮 ¥1200，工时 ¥300 · 后刹车皮 ¥1000，工时 ¥300', '刹车油 ¥256，工时 ¥360 · 空气滤芯 ¥149'] },
        { title: '610 · 奥星越秀', lines: ['前盘式制动器摩擦块套件 58101-IBA00：¥1652.05，需订货，工时 ¥500', '空气滤芯原厂 ¥115 · 空调滤芯原厂 ¥425 / 副厂 ¥95，工时 ¥50'] },
      ] },
      { id: '09', title: '维修手册', subtitle: 'SERVICE MANUAL', cards: [
        { title: '改款前维修手册 · 英文', lines: ['个人主体小程序不能直接跳外链；点击复制链接后到浏览器打开。', 'https://www.hexorcism.com/22CN7N/'] },
      ] },
      { id: '10', title: '工程模式', subtitle: 'ENGINEERING MODE · 谨慎操作', cards: [
        { title: '进入方法', lines: ['车机开机 → 收音机 → 音量 2 → 设置 / 通用', '更新按钮左侧点 5 下，再点右侧 1 下', '密码：23060663', '仅用于查看，请勿随意修改参数。'] },
      ] },
      { id: '11', title: '经验记录', subtitle: 'OWNER NOTES', cards: [
        { title: '加装法兰异响', lines: ['加装法兰之后轮圈轴头出现“搁楞搁楞”异响，可在法兰合头之间垫一层铜皮处理。'] },
      ] },
    ],
  },

  onLoad() { shareUtil.enableShareMenu(); this._allSections = this.data.sections; this._applyTheme() },
  onShow() { this._applyTheme() },
  _applyTheme() {
    var app = getApp()
    var mode = app.globalData.themeMode || 'auto'
    var nav = themeUtil.navColors(themeUtil.isDarkEffective(mode))
    this.setData({ themeMode: mode, pageStyle: themeUtil.getPageStyle(mode), navBg: nav.navBg, navColor: nav.navColor })
  },
  onThemeToggle() {
    var app = getApp()
    var mode = themeUtil.nextMode(app.globalData.themeMode || 'auto')
    app.globalData.themeMode = mode
    themeUtil.saveMode(mode)
    this._applyTheme()
  },
  onCopyLine(e) { wx.setClipboardData({ data: e.currentTarget.dataset.value }) },
  onSearch(e) {
    var query = (e.detail.value || '').trim().toLowerCase()
    var source = this._allSections || []
    var sections = !query ? source : source.map(function(section) {
      var cards = section.cards.filter(function(card) {
        return (card.title + ' ' + card.lines.join(' ')).toLowerCase().indexOf(query) !== -1
      })
      return Object.assign({}, section, { cards: cards })
    }).filter(function(section) { return section.cards.length })
    this.setData({ query: query, sections: sections })
  },
  onPsi(e) { var v = Number(e.detail.value); this.setData({ psi: e.detail.value, kpa: isFinite(v) ? (v * 6.894757).toFixed(0) : '', bar: isFinite(v) ? (v * 0.06894757).toFixed(2) : '' }) },
  onKpa(e) { var v = Number(e.detail.value); this.setData({ kpa: e.detail.value, psi: isFinite(v) ? (v / 6.894757).toFixed(1) : '', bar: isFinite(v) ? (v / 100).toFixed(2) : '' }) },
  onBar(e) { var v = Number(e.detail.value); this.setData({ bar: e.detail.value, psi: isFinite(v) ? (v * 14.503774).toFixed(1) : '', kpa: isFinite(v) ? (v * 100).toFixed(0) : '' }) },
  onQuickPsi(e) { var v = String(e.currentTarget.dataset.value); this.onPsi({ detail: { value: v } }) },
  onShareAppMessage() { return shareUtil.appMessage('knowledge') },
  onShareTimeline() { return shareUtil.timeline('knowledge') },
})
