# 项目经历与改动记录

这份文档记录本项目从立项到 2026-09-03 的开发经历、做过的修改、踩过的坑。  
操作手册见根目录 `STARTUP.md`。本文是「为什么是现在这样」，不是「怎么打开工程」。

对话语言：中文。主人不会 JS/TS，小程序代码由助手全权负责并自检。

---

## 1. 项目是什么

微信小程序：把 Elantra N / Avante N CN7 的 OBD PID 内置进去，筛选 → 多选 → 生成本地配置文件。

目标 App：Car Scanner、RaceChrono、LUFI XF。早期考虑过 OBD Fusion，现已取消该方向。
**第一阶段只做 Car Scanner（`.csp`）**。不用云、不登录、不多车型。

核心约束（立项时主人写死的）：

- JS / 小程序由助手负责，不要让主人 review JS
- 方案优先：简单、稳定、易维护、适合小程序、不依赖云
- 除非明确要求，不引入第三方依赖

数据源（不要手改）：

- `data/avante_n_cn7_profile_614_all_pids.csv`（约 2680 条，完整 PID）
- `data/avante_n_cn7_profile_614_all_pids_cn.xlsx`（后补的中文名；更早用过另一份 xlsx，已替换）
- 规则：`readme/avante_n_cn7_custom_pid_conversion_guide_zh.md`
- CSP 样例：`sample/custompids.csp`

Python 环境：`D:\miniconda3\envs\obd_stats`（3.11 + openpyxl），只用来跑 `scripts/convert_csv.py`。

---

## 2. 时间线

### 2026-08-29 立项与骨架

主人给出完整需求：筛选 → 多选 → 按目标 App 导出。助手从微信小程序模板开始改。

做了这些：

- `scripts/convert_csv.py`：CSV + 中文 xlsx → 小程序可用数据
- 最初输出 `data/pids.json`，后来发现小程序 **不能 `require('.json')`**，改成 `data/pids.js`（`module.exports = [...]`）
- 清掉默认 `index` / `logs` 作为入口（文件还在，但 `app.json` 不再列它们）
- 三页骨架：`pages/filter`、`pages/params`、`pages/export`
- `utils/ecuCategories.js`、`paramTypes.js`、`pidData.js`
- `utils/formulaParser.js`、`carScannerExporter.js`、`fileHelper.js`

页面口径（后来才对齐，见第 5 节）：

| 口头 | 实际 |
|---|---|
| 主页 | 筛选页 `pages/filter` |
| 参数页 | 选择参数 `pages/params` |
| 导出页 | 导出配置 `pages/export` |

conda 环境名：`obd_stats`。中文 xlsx 曾按错编码读出乱码，改用 openpyxl 按表头列名读。

### 2026-08-30 能跑通，然后修一串真机/模拟器问题

主人反馈筛选 chip 点了没反应，以为「还没开发到」。其实已经写了，是渲染和数据加载问题。

依次修过：

1. **Skyline**：`scroll-view type="list"`、chip 点不了、`page-meta` 主题不生效。最后 **关掉 Skyline**（`project.private.config.json` 里 `skylineRenderEnable: false`），走 WebView。不要加回去。
2. **「全部」chip**：`data-group=""` 在微信里丢了，改成 `data-group="_all"`。
3. **`require('../data/pids.json')` 失败**：改 `pids.js` + `require('../data/pids')`。
4. **导出分享**：`shareFileMessage: fail can only be invoked by user TAP gesture`。必须在点击同步栈里 `writeFileSync` 再分享，不能先异步 `writeFile` 再在回调里分享。开发者工具里分享仍可能 `shareSkipped`，文件其实已经写到 `USER_DATA_PATH`。
5. 导出页底部「共几个参数」曾和「这一次导出数量」混在一起，后来分开了。

当天主人确认「目前可用」，并要求深色模式。先做了跟随系统的暗色，主人找不到切换入口，改成 **页面内按钮**：`auto → dark → light` 循环，存在 `wx.setStorageSync('themeMode')`。

主题实现：`utils/theme.js` 拼 CSS 变量，经 `page-meta page-style` 注入。只改 `app.wxss` 不够。检测系统主题用 `wx.getAppBaseInfo()`，不要再用已弃用的 `wx.getSystemInfoSync`。

Skyline 相关 `app.json rendererOptions.skyline.tagNameStyleIsolation` 告警：关掉 Skyline 后可忽略。  
`DOMNodeRemoved` mutation 告警：Chromium 提示，可忽略。

同一天还做过：对照 CSV 看哪些字段真正用到；`region_name` 确认没用；换上新的 `*_cn.xlsx` 重跑转换。N 配色当时问过现代 N 的色，先搁置，后面才落地。

### 2026-09-03 主题打磨 + 购物车

主题按钮：

- 不喜欢 🌗 Unicode。Emoji 宽度不一，切换时导航标题会左右跳。
- 改成 CSS mask SVG（太阳 / 月牙 / 手机），容器固定 44×44。
- 主人改过 auto 图标（手机外形），可用。
- 删 `modeIcon` 后忘了从 `module.exports` 拿掉，报 `modeIcon is not defined`。已修。
- 主人误删 `.theme-icon-*` 样式导致按钮空白，已从 `filter.wxss` 恢复。
- 默认模式在 `theme.js` 的 `loadMode()`：没有缓存时 `'auto'`。

配色（主人指定 Hyundai N）：

- **N蓝** Performance Blue `#aacae6`
- **N红** Active Red `#e63312`
- 参数详情文字用 N蓝（浅色、深色都是），不要为了对比度改中文标题颜色
- 参数页「选中行」不要再用 N蓝（深色下会盖住 N蓝详情字），改成 N红
- 筛选页 chip、主按钮仍偏 N蓝（后来 `theme.js` 可能又被继续改过，以文件里 `N_BLUE` / `N_RED` 注释为准）

购物车（本会话主要功能）：

主人要求：选完要能看到 **具体选了哪些**，不能只有「已选 x 个」。

| 页面 | 交互 |
|---|---|
| 参数页 | 右上角数量改到底部横条；点「已选 x 个」展开列表；可移除 / 清空；旁边是「导出」 |
| 导出页 | 点顶部蓝色/彩色摘要卡展开已选列表 |
| 主页（筛选页） | 同样底部购物车；展开后可「导出」或继续「查看参数列表」 |

已选 ID 在 `app.globalData.selectedIds`，三页共用。`getCartPids()` 只 `setData` 瘦对象（id、中英文名、ECU、单位）。

上限 `MAX_SELECT = 100` 是助手加的软限制，**不是** Car Scanner / OBD 硬限制。主人问过「为什么是 100」，暂未要求改掉。

购物车空列表 bug：选了 4 个，点开显示「还没有选择参数」。原因是 `wx:if` 临时插入面板，里面再套 `scroll-view`，微信经常画不出列表。改成面板一直在、用 `is-hidden`（`display:none`），高度用 rpx 不用 `vh`，打开时重新按 ID 拉列表。

口径对齐：主人说「主页」= 筛选页。之前把「主页购物车」做成了参数页，所以主页当时看起来没购物车。

最后写了 `STARTUP.md`，方便换编辑器接着做。

---

## 3. 现在仓库里有什么（相对 Initial Commit）

Git 仍停在 `85b995a Initial Commit`，后面改动大多未提交。

主要新增 / 重写：

- `utils/theme.js`（主题变量、N蓝 N红、导航栏颜色）
- `utils/formulaParser.js`、`carScannerExporter.js`、`fileHelper.js`
- `utils/ecuCategories.js`、`paramTypes.js`、`pidData.js`（含 `getCartPids`）
- `scripts/convert_csv.py`、`data/pids.js`
- 三页 `filter` / `params` / `export` 的 js/wxml/wxss
- `STARTUP.md`、本文

入口改动：`app.js` 的 `globalData`（筛选、已选、主题）；`app.json` 只保留三页、自定义导航、无 Skyline。

不要提交：`.idea/`、无用密钥。`data/pids.js` 很大，但是小程序运行必需。

---

## 4. 架构（做功能时按这个找文件）

```text
主页 chip
  → globalData.filterEcu / filterType
  → 参数页 filterPids() 列出 PID，勾选写入 globalData.selectedIds
  → 导出页 getPidsByIds() → generateCsp() → saveAndShare()
购物车三页都读 selectedIds，展示用 getCartPids()
主题：每页 onShow → theme.getPageStyle() → page-meta
```

公式：CSV 的 `conv_rule` 经 `formulaParser` 转成 Car Scanner 的 `FR` 等字段。DCT 油温等按转换文档处理过 `G-40` / `H-40`、`ShortSigned`。改公式先读那份 md，再改 parser，不要在页面里写特例。

---

## 5. 和主人的约定（容易再搞错）

- **主页 = 筛选页**，不是参数页
- 品牌色叫 **N蓝 / N红**，不要再叫 Performance Blue / Active Red 给主人听
- 对话中文；代码英文标点
- 不要擅自做 RaceChrono / 云 / 改 100 条上限。LUFI XF 必须基于官方 `.INI` 模板，不能从零生成。
- 不要让主人改 JS；助手改完自己在开发者工具路径上想清楚怎么测
- 小程序不能当网页在 Chrome 里点按验收

---

## 6. 未完成

- RaceChrono、LUFI XF 导出（LUFI 需要官方模板文件后再开放）
- 100 条选择上限是否取消或加大
- 主题在换编辑器之后可能又改过一版（浅色用 N红做强调），以 `utils/theme.js` 当前文件为准
- 代码从未在 git 上提交过第二笔，换机器记得把未提交文件一起带走
