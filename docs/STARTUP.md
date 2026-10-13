# Elantra N OBD stats — 换编辑器启动说明

操作手册见 `docs/STARTUP.md`。开发经历、改过什么、踩过什么坑见 `docs/HISTORY.md`。

主人不懂 JS/TS，由助手全权实现并自检。对话用中文；代码、API、文件名用英文。代码注释即使用中文也必须用英文标点。

---

## 怎么打开

1. 用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 导入本目录。
2. AppID: `wx113792b30d798c93`（见 `project.config.json`）。
3. 基础库约 `3.17.2`。**必须关闭 Skyline**（`project.private.config.json` 里 `skylineRenderEnable: false`）。Skyline 会导致 chip 点不了、`page-meta` 主题不生效、`scroll-view` 列表空白。
4. 改完点编译。购物车列表异常时先清缓存再编译。
5. 无法在普通浏览器里点按验证，以开发者工具 / 真机为准。

Python 只用于转数据，不跑小程序：

```text
D:\miniconda3\envs\obd_stats\python.exe scripts/convert_csv.py
```

环境是 3.11 + openpyxl。CSV / xlsx 有更新才需要跑。

---

## 页面口径（必须按这个叫）

| 口头 | 页面 | 路径 | 顶栏 |
|---|---|---|---|
| **主页** | 筛选页 | `pages/filter/` | OBD 参数筛选 |
| **参数页** | 选择参数 | `pages/params/` | 选择参数 |
| **导出页** | 导出配置 | `pages/export/` | 导出配置 |

流程：主页选 ECU / 类型 → 点「查看参数列表」进参数页勾 PID → 导出页生成 `.csp`。

主页 / 参数页底部都有购物车（点「已选 x 个」展开列表，可移除 / 清空）。导出页点顶部摘要卡展开已选列表。

`pages/index`、`pages/logs` 是模板残留，**不在** `app.json` 的 pages 里，不要当入口。

---

## 目录

```text
app.js / app.json / app.wxss     入口。不要加回 Skyline
components/navigation-bar/       自定义导航栏
pages/filter|params|export/      三页
utils/                           数据、主题、公式、导出
data/                            源数据 + 生成的 pids.js
scripts/convert_csv.py           CSV+xlsx → data/pids.js
docs/examples/car-scanner/custompids.csp            Car Scanner 格式样例
docs/obd/reference/avante_n_cn7_custom_pid_conversion_guide_zh.md   公式转换规则
```

`data/pids.js` 约 874KB，`module.exports = [...]`。小程序 **不能** `require('.json')`，所以是 `.js` 不是 `.json`。不要手改 `pids.js`，改源数据后跑转换脚本。

不要改：

- `data/avante_n_cn7_profile_614_all_pids.csv`（约 2680 条）
- `data/avante_n_cn7_profile_614_all_pids_cn.xlsx`（中文名）

---

## 状态存在哪

`app.globalData`（`app.js`）：

- `themeMode`: `'auto' | 'dark' | 'light'`，本地 `wx.setStorageSync('themeMode')`
- `systemTheme`: 系统深浅色
- `filterEcu` / `filterType`: 主页当前筛选
- `selectedIds`: 已选 PID id 数组（字符串）。三页购物车都读这份

数据访问只走 `utils/pidData.js`：`filterPids`、`getPidsByIds`、`getCartPids`（购物车用瘦对象，避免 `setData` 整份 PID）。

分类：`utils/ecuCategories.js`、`utils/paramTypes.js`。不要把分类逻辑散到页面里。

导出：`utils/formulaParser.js` → `utils/carScannerExporter.js` → `utils/fileHelper.js`。

`fileHelper.saveAndShare` 必须在 **用户点击的同步栈** 里调用（`writeFileSync` + `shareFileMessage`）。开发者工具里分享可能 `shareSkipped`，文件其实已经写到 `USER_DATA_PATH`。

---

## 主题

`utils/theme.js` 用 `page-meta page-style` 注入 CSS 变量。每页 `onShow` 调 `_applyTheme()`。

品牌色（就叫这两个名字）：

- **N蓝** Performance Blue `#aacae6`：详情文字、chip 选中、主按钮
- **N红** Active Red `#e63312`：参数页选中行底、勾选框

深浅色下详情文字都是 N蓝。中文标题：浅色黑、深色白。不要为了对比度去改标题文字颜色。

主题按钮在主页导航栏右侧，循环：`auto → dark → light`。图标是 CSS mask SVG，固定 44×44，避免标题被挤偏。

---

## 已完成

- 主页 ECU / 类型筛选（chip 可再点取消；`data-group="_all"` 不要用空字符串）
- 参数页多选、全选；全局已选上限 `MAX_SELECT = 100`（拍脑袋软限制，不是 Car Scanner 硬限制）
- 三页购物车（主页、参数页底部条；导出页点摘要卡）
- Car Scanner `.csp` 导出（对照 `docs/examples/car-scanner/custompids.csp` 和转换文档）
- 手动主题 auto / dark / light
- 已从 `app.json` 去掉 Skyline / WebView 混用问题：当前是 WebView

公式侧已对照文档处理过 DCT 油温 `G-40` / `H-40`、`ShortSigned` 等。改公式先看 `docs/obd/reference/avante_n_cn7_custom_pid_conversion_guide_zh.md`。

---

## 未做 / 不要擅自扩大

- RaceChrono：导出页保留占位。LUFI XF：已基于官方 `.INI` 模板打包导出，不能从零生成二进制 INI。
- 云同步、登录、多车型
- 去掉或改 100 条上限：等主人说
- 不要把 `pages/index` 加回入口

---

## 踩过的坑（改 UI 前先看）

1. **Skyline 关掉。** chip 无响应、主题不生效、列表空白，优先查这个。
2. **`scroll-view` 不要 `type="list"`**（Skyline 列表类型）。购物车面板不要用 `wx:if` 临时插入再套 `scroll-view`，会显示「还没有选择参数」；用 class 隐藏（`is-hidden` / `display:none`），高度用 rpx 不要依赖 `vh`。
3. **`require('../data/pids.json')` 会失败**，必须 `require('../data/pids')` 对应 `pids.js`。
4. 筛选「全部」用 `data-group="_all"` / `data-type="_all"`，不要 `data-group=""`。
5. `shareFileMessage` 不能放进 `writeFile` 回调；必须同步写文件。
6. 主题变量在 `theme.js` 的 `LIGHT_VARS` / `DARK_VARS`。只改 `app.wxss` 不够，`page-meta` 会覆盖。
7. PID `id` 当字符串处理。购物车 `dataset.id` 一律 `String(...)` 再比。

---

## 给下一个编辑器里的 AI

- 先读本文件，再动代码。
- 主人说「主页」= 筛选页，不是参数页。
- 最小改动；不要重构无关文件；不要新增云或新 App 导出，除非明确要求。
- `.cursor/skills/token-efficient/SKILL.md` 仍可用：少扫目录、改完只汇报改了什么 / 哪些文件 / 怎么验证。
- 验证：微信开发者工具走主路径（筛选 → 勾选 → 购物车能看到具体项 → 导出）。不要声称已在浏览器点过。
