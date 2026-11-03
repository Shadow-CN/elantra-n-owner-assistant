# 现代 N 车主助手：开发与内容维护指南

本轮开发分支：`codex/rcz-obd-wiki`。稳定分支 `main` 保留在 `c4a004c`；本轮功能须验证后再决定是否合并。

原生微信小程序，服务伊兰特 N（EN / CN7N）和 IONIQ 5 N（5N）车主。包含车主 Wiki、圈速榜、OBD 配置导出、压力换算和汇率换算。

**先找文件：不确定改哪里时，先查下面的表格。继续开发请同时阅读 [HANDOFF.md](HANDOFF.md)。**

## 1. 我想改什么，应该找哪个文件？

以下都是相对项目根目录的路径；点击文件链接可以打开。

| 想修改的内容 | 文件 | 修改位置／说明 |
|---|---|---|
| 小程序首页入口、文字、卡片顺序 | [pages/index/index.wxml](pages/index/index.wxml) | 按标签从上到下显示；点击行为在同目录 `index.js` |
| 版本更新内容、弹窗版本号 | [data/changelog.js](data/changelog.js) | 新版本在数组最前面追加，version递增；用户关闭后同版不再弹 |
| 更新弹窗及已读判断 | `components/update-notice/`、[version.js](utils/version.js) | 通用导航栏挂载，覆盖首页和分享直达页面 |
| 实用工具列表、工具简介 | [pages/tools/tools.wxml](pages/tools/tools.wxml) | 压力、汇率、轮毂入口；跳转在 `tools.js` |
| 实用工具页背景与卡片样式 | [pages/tools/tools.wxss](pages/tools/tools.wxss) | 已移除右上角径向渐变晕影 |
| EN 分类、文章、零件号、备注、图片顺序 | [knowledgeElantra.js](packages/knowledge/data/knowledgeElantra.js) | 搜索词条标题，例如“钥匙”“脚垫卡扣”“迎宾灯” |
| 5N 分类、文章、表格、图片顺序 | [knowledge5n.js](packages/knowledge/data/knowledge5n.js) | 运行时数据；手工编辑会立即影响编译结果，重建脚本会覆盖该文件 |
| Wiki 首页车型名称、简介、来源链接 | 上面两份数据文件 | 顶部 `name`、`english`、`description`、`sourceLink`、`source`；`english` 不保证单独显示 |
| Wiki 首页标题、分类目录布局、搜索框 | [knowledge.wxml](packages/knowledge/knowledge/knowledge.wxml)、[knowledge.wxss](packages/knowledge/knowledge/knowledge.wxss) | 5N“手册与资料”通过分类05的样式占整行 |
| Wiki 搜索、分类选择、返回行为 | [knowledge.js](packages/knowledge/knowledge/knowledge.js) | 搜索→分类→Wiki目录→上一页；分享直达时提供首页回退 |
| 词条详情页面排版、图片、复制按钮 | [article.wxml](packages/knowledge/article/article.wxml)、[article.wxss](packages/knowledge/article/article.wxss) | 行为在同目录 `article.js` |
| Wiki 搜索匹配、关联文章 | [wiki.js](packages/knowledge/lib/wiki.js) | 文章使用显式固定ID，改标题保留id即可；aliases兼容更早链接 |
| Wiki 自动生成搜索／复制文字、图片列表 | [content.js](packages/knowledge/lib/content.js) | parts生成零件文字，blocks生成富文本及图库；不用重复填写 |
| 知识库图片加载、临时链接缓存、附件下载 | [media.js](packages/knowledge/lib/media.js) | 从云函数获取链接；图片失败可重试；附件先下载再点击分享 |
| 图片和RC附件的云端位置 | [assets.json](cloudfunctions/wikiFiles/assets.json) | 逻辑路径→永久cloud fileID白名单；不要写临时签名URL |
| PDF手册文件名和资料入口 | EN/5N数据文件的 `document` | `name` 为文件名，`key` 对应下方PDF白名单 |
| PDF实际云文件ID | [files.json](cloudfunctions/wikiFiles/files.json) | 当前含EN中文手册、5N手册、ETC手册 |
| 腾讯文档链接 | EN数据中 `experience` 分类的 `externalLink` | `url`为复制备用链接，`shortLink`为腾讯文档小程序直达链接 |
| 圈速榜页面、表单文字、成绩列表布局 | [pages/laps/laps.wxml](pages/laps/laps.wxml) | 样式在 `laps.wxss`，行为在 `laps.js` |
| 圈速输入、上传、编辑、删除、分享 | [pages/laps/laps.js](pages/laps/laps.js) | 分／秒／毫秒；毫秒选填；视频和视频链接选填 |
| 成绩详情页 | [pages/lap-detail/lap-detail.wxml](pages/lap-detail/lap-detail.wxml) | 视频／外链→基础信息→改装项；行为在同目录JS |
| 我的成绩：个人最佳、提升和进步轨迹 | [lapProgress.js](utils/lapProgress.js)、[laps.wxml](pages/laps/laps.wxml) | 同赛道／车辆名称／干湿地分组；同日取最佳，仅展示刷新最佳的日期 |
| 赛道名称、地区归属、拼音排序 | [data/tracks.js](data/tracks.js) | 唯一手工维护入口，保留已有ID；修改后运行生成命令 |
| 改装字段、输入校验 | [utils/laps.js](utils/laps.js) | `MOD_FIELDS`、`validate`；修改后运行生成命令 |
| 云端成绩校验 | [validation.js](cloudfunctions/lapBoard/validation.js) | 自动生成，不直接编辑；源文件为 `utils/laps.js`，生成后部署 `lapBoard` |
| 赛道配置生成、地区下拉顺序 | [build_lap_config.cjs](scripts/build_lap_config.cjs)、[trackCatalog.js](utils/trackCatalog.js) | 前者生成云端文件，后者从统一配置计算下拉选项 |
| 自动定位推荐 | [trackLocation.js](utils/trackLocation.js) | 本地省界匹配，不上传坐标；地区自动读取统一赛道配置 |
| 成绩数据库查询／权限／视频清理 | [lapBoard/index.js](cloudfunctions/lapBoard/index.js) | 操作 `lap_records`，归属检查由云端执行 |
| 压力换算内容、默认参考值 | [pages/tire/tire.js](pages/tire/tire.js)、[tire.wxml](pages/tire/tire.wxml) | 不是圈速榜温度字段 |
| 汇率页面和交互 | [pages/exchange/exchange.js](pages/exchange/exchange.js)、[exchange.wxml](pages/exchange/exchange.wxml) | 金额、币种、交换、刷新、缓存提示 |
| 支持哪些币种、金额计算规则 | [utils/exchange.js](utils/exchange.js) | `CURRENCIES`；增币种需同时更新云端 `rates.js` |
| 汇率API与数据校验 | [rates.js](cloudfunctions/exchangeRates/rates.js) | 固定从Frankfurter取每日参考汇率，不接受用户传任意URL |
| 汇率缓存、失败回退 | [exchangeRates/index.js](cloudfunctions/exchangeRates/index.js) | 服务端6小时缓存，本地保留最近成功数据，最多7天；界面显示缓存状态 |
| OBD中文名、PID、单位等运行时数据 | [data/pids.js](data/pids.js) | 大文件，先搜索参数名；数据生成说明见下文 |
| OBD车型标签、筛选、参数选择 | `pages/filter/`、`pages/params/` | EN现有功能保留；5N页签先展示数据整理中，不能导出EN数据 |
| Car Scanner / LUFI导出 | `pages/export/` | `.csp`与LUFI二进制INI压缩包 |
| RaceChrono参数转换 | `pages/racechrono/`、[raceChronoExporter.js](utils/raceChronoExporter.js) | 页面保留七项逐项复制；导出已改为RCZ |
| RCZ车辆配置打包 | [raceChronoProfile.js](utils/raceChronoProfile.js)、[zip.js](utils/zip.js) | 通道数字ID、快慢分组、JSON及ZIP封装 |
| 全局颜色和深浅模式 | [app.wxss](app.wxss)、[theme.js](utils/theme.js) | auto→dark→light；页面通过主题变量取色 |
| 页面最上面的标题 | 对应页面 `.wxml` 中的 `<navigation-bar title="…">` | 例如“车主 Wiki”“赛道圈速榜”，不是数据文件里的车型名称 |
| 顶部导航栏、左上角箭头 | `components/navigation-bar/` | Wiki用delta=0由页面处理返回；其他页面通常默认原生返回 |
| 微信分享标题和通用路径 | [utils/share.js](utils/share.js) | Wiki和圈速榜另有动态分享回调 |
| 新增页面注册 | [app.json](app.json) | 主包写 `pages`，知识库写 `subPackages` |
| 云开发环境初始化 | [app.js](app.js) | `wx.cloud.init` |
| 哪些文件不打包 | [project.config.json](project.config.json) | `packOptions.ignore`，勿误删知识库资源排除规则 |
| 本机开发者工具偏好 | `project.private.config.json` | 仅本地保留，不提交Git |

## 2. 修改知识库正文和零件号

EN修改 `packages/knowledge/data/knowledgeElantra.js`，5N修改同目录 `knowledge5n.js`。两份文件都可以直接维护。**同一内容只写一次，搜索和全文复制会自动同步。**

### 修改配件、编号和备注

只改 `parts` 对应字段，不需要再改一份搜索文字：

```js
{
  "id": "已有词条的固定ID请保留",
  "title": "词条标题",
  "summary": "列表中的简短介绍（可选）",
  "parts": [{
    "name": "配件名称",
    "brand": "品牌（可选）",
    "codes": ["零件编号"],
    "note": "订购／适配备注（可选）"
  }],
  "lines": ["配件下方额外说明（可选）；这里不用重复配件名称、编号或备注"]
}
```

只有配件信息时可省略 `lines`。运行时会自动将配件名称、品牌、编号、备注加入搜索及全文复制。原来的 `partLineIndexes` 已不需要。

### 修改普通文字词条

没有复杂排版的文章仍用 `lines`，一行一个字符串；这些文字同时用于显示、搜索和复制。没有 `parts`、`blocks` 时保持现有写法即可。

### 修改图文、表格词条

**有 `blocks` 的文章只编辑 `blocks`**，不要再填写 `lines`、`images` 或 `image`。文字、表格和图片顺序都按 `blocks` 从上到下排列：

```js
{
  "id": "已有词条的固定ID请保留",
  "title": "安装说明",
  "blocks": [
    {"type": "heading", "text": "安装位置"},
    {"type": "text", "text": "这里写正文说明", "indent": 0},
    {"type": "image", "src": "/packages/knowledge/assets/knowledge/你的图片.jpg"},
    {"type": "table", "headers": ["项目", "规格"], "rows": [["轮毂", "19×9J ET43"]]}
  ]
}
```

图片浏览顺序自动跟随正文顺序，全文复制自动包含文字、标题及表格。带 `resource` 的附件名称也会自动加入搜索和复制。云图片新增／替换仍需按第3节上传并更新白名单。

普通文章若需要末尾图片组，仍可使用 `images`，按数组顺序展示；这种文章不需要 `blocks`。脚垫卡扣仍是安装示意→原参考图→特写→安装实拍；迎宾灯按 `blocks` 中顺序显示。

### 修改标题、分类和分享链接

所有现有词条已写入固定 `id`，改标题或将词条搬到另一个分类时**保留这个id**即可保持分享地址和关联条目有效。不要改动已有分类ID或删除旧 `aliases`。新增词条可以省略id，程序会按分类和标题生成；确认上线前建议固定下来，整个知识库内必须唯一。

### 5N上游资料导入脚本

`scripts/build_5n_wiki.py` 用于从本地上游Markdown整理候选资料，小程序不运行Python。现在输出到 **`docs/generated/knowledge5n.import.js`**，供人工对照合并，**不会覆盖运行中的 knowledge5n.js**。生成的候选资料也使用 `blocks` 单处维护结构。

合并时保留现有词条id及aliases，并核对你已经手工修改的内容，不要整份替换运行时文件。云资源清单脚本 `build_wiki_assets.cjs` 仍只生成资源映射，不改正文。

## 3. 图片、文档、视频现在放在哪里？

| 内容 | 存放与访问方式 |
|---|---|
| Wiki图片及 `vehicle_i5n.rcz` | 云存储 `knowledge/assets/media-20261103/`；由 `wikiFiles` 按白名单提供临时URL |
| 本地图片与附件原件／维护副本 | 仍在 `packages/knowledge/assets/knowledge/`，已通过打包规则排除；保留在仓库供编辑、重传和备份 |
| 中文PDF手册 | 云存储 `knowledge/en/manual/`、`knowledge/5n/manual/`；入口白名单在 `files.json` |
| 圈速视频 | 用户提交时上传云存储，文件归属与删除由 `lapBoard` 管理 |
| 图标、页面代码、样式 | 小程序包内，保证基础界面可加载 |
| EN/5N文字、目录、零件号 | 仍在JS里，修改后需编译／发布小程序；本次未迁到数据库 |
| CSV、Excel、本地上游Wiki、文档与开发脚本 | 本地维护资料，不打包 |

**数据文件里的 `/packages/knowledge/assets/…` 是逻辑资源标识，不代表这些图片还打进小程序包。不要直接把它改成带签名的临时网址。**

- 服务端映射：`cloudfunctions/wikiFiles/assets.json`。
- 加载代码：`packages/knowledge/lib/media.js`；链接在内存中缓存并提前失效，失败可重试。
- 图片由微信按需加载；无网络时未缓存的图片可能不可见，文字仍可阅读。
- RC文件在词条打开后准备下载，下载完成后按钮变成“分享 RC 配置文件”，分享在用户点击时同步触发。
- PDF仍是点击下载后打开，不提前下载整本手册。
- 上传校验清单：`docs/wiki-assets-manifest.json`；首次迁移校验结果：`docs/wiki-assets-upload-verification.json`。
- 本次迁移不改变存储权限规则，不使用临时URL充当永久配置。

### 新增或替换知识库图片的步骤

1. 把展示图片放到 `packages/knowledge/assets/knowledge/` 合适的子目录，原始照片另行备份。
2. 在微信开发者工具“云开发 → 存储”上传同样的相对目录结构；例如本地 `en-carpet-clip/installed.jpg` 对应云端 `knowledge/assets/media-20261103/en-carpet-clip/installed.jpg`。
3. 运行 `node scripts/build_wiki_assets.cjs`，更新服务器白名单与本地清单；不会改写EN/5N正文。
4. 在相应知识库词条的 `image`、`images` 或 `blocks` 中写逻辑路径。
5. 右键 `cloudfunctions/wikiFiles` → “上传并部署：云端安装依赖”。
6. 编译小程序，打开对应词条检查图片与点击放大，再运行包体检查。

若要整批发布新版资源，可以上传到新云目录，再运行例如 `node scripts/build_wiki_assets.cjs knowledge/assets/media-v2`。保留旧目录供已发布版本使用；不要立即删除仍可能被访问的旧资源。替换图片时优先换文件名，减少缓存显示旧图的问题。

### 新增PDF

上传PDF到云存储，在 `files.json` 增加一个英文key与永久fileID，然后在词条写：

```js
"document": {"name": "显示文件名.pdf", "key": "新资料的key"}
```

部署 `wikiFiles` 后编译。不要把大PDF直接放进小程序包。

## 4. 新增赛道与地区

**只编辑 [data/tracks.js](data/tracks.js)**。成绩、分享链接和定位使用稳定编号，只能在数组末尾追加，不要重排、删除或复用已有ID。

文件分两部分：

- `regions`：地区的 `id`、`name`、`pinyin`；国外地区增加 `overseas: true`。国内地区先按拼音排序，国外地区统一排在最后，再按拼音排序。
- `tracks`：赛道的 `id`、`name`、`region`（所属地区ID）、`pinyin`。

例如，目前下一个赛道ID为20，天津地区ID为7，可在 `tracks` 末尾追加（示例名称，按实际赛道修改）：

```js
{ "id": 20, "name": "天津示例赛车场", "region": 7, "pinyin": "tianjinshili" }
```

新增地区时先在 `regions` 末尾追加，再让新赛道引用它的ID。两类ID均须与数组位置相同，拼音键用于展示排序；展示顺序不会改变存储编号。

修改后执行：

```powershell
node scripts/build_lap_config.cjs
node scripts/check_all.cjs
```

生成器从 `data/tracks.js` 和 `utils/laps.js` 生成云函数内的 `tracks.js`、`validation.js`，不修改数据库，也不会自动部署。检查通过后部署整个 `lapBoard` 云函数，再编译、预览小程序。仅检查是否同步可运行 `node scripts/build_lap_config.cjs --check`。

**修改改装字段或输入校验**仍编辑 `utils/laps.js`，然后执行同样的生成、检查与部署步骤。不要直接编辑自动生成的云端文件。

现有V1：编号11为2.4km，编号19为4.29km。分享指定赛道时仍不会被定位覆盖。已发布ID和地区归属由 `scripts/test_track_catalog.cjs` 检查，不能为了让测试通过而随意改动旧编号。

## 5. 汇率换算

入口：实用工具 → 汇率换算。支持人民币CNY、韩元KRW、美元USD、日元JPY、新台币TWD、港币HKD、澳元AUD、加元CAD、欧元EUR。

- 来源：[Frankfurter官方API说明](https://frankfurter.dev/)，每日参考汇率，不是银行实时买入／卖出价。
- 云函数向固定API请求以CNY为基准的汇率，再在手机上进行交叉换算；用户填写的金额不会发送给汇率提供方。
- 不需要API Key，也不需要给小程序额外配置第三方request域名，外部请求由云函数发出。
- 每个币种显示对应汇率日期；不同日期会并列显示。周末、假期数据日期可能早于当天。
- 服务端最多每6小时更新缓存；缓存存在云数据库 `exchange_rates` 的 `latest` 文档，只有服务端读写。前端不会直接操作该集合。
- 取数失败时最多使用最近7天内成功获取的数据，并明确显示缓存状态；没有可用数据时不显示虚构结果。
- 增加币种需同步 `utils/exchange.js` 的 `CURRENCIES` 与 `cloudfunctions/exchangeRates/rates.js` 的 `CODES`，部署后编译。
- 如需实际支付成本，还需考虑银行点差、手续费和平台费用。

## 6. 本地运行、部署和后台管理

1. 用微信开发者工具导入项目根目录。
2. AppID在 `project.config.json`；云环境初始化在 `app.js`。
3. 当前环境为 `hn-owner-asst-d7gufu33n85700993`，不是数据库连接网址。后台数据通过开发者工具“云开发 → 数据库”管理。
4. 成绩集合 `lap_records`；汇率缓存集合 `exchange_rates`。不要为方便调试开放任意用户写权限。
5. 编译、预览、真机检查。数据库／云函数修改与小程序上传发布是两个步骤。

云函数目录：

| 云函数 | 用途 | 修改后操作 |
|---|---|---|
| `lapBoard` | 成绩查询、提交、修改、删除、视频访问与归属校验 | 上传部署该函数 |
| `wikiFiles` | PDF、图片、RC附件白名单与访问链接 | 上传部署该函数 |
| `exchangeRates` | 每日汇率与服务端缓存 | 上传部署该函数 |

部署推荐直接在开发者工具里右键函数文件夹，选择“上传并部署：云端安装依赖”。新函数创建后可能短暂处于Creating，等待完成再重试；更新后也需要等待状态正常再验证。

CLI/MCP访问密钥只在本机使用，不写进README、代码或Git。`scripts/wechat_mcp.cjs` 从 `WECHAT_DEVTOOLS_CLI_TOKEN` 环境变量读取。`project.private.config.json` 不提交。

## 7. OBD源数据和导出

- 运行时PID数据：`data/pids.js`。
- 原始CSV：`data/avante_n_cn7_profile_614_all_pids.csv`。
- 当前Excel文件名含空格：`data/avante_n_cn7_profile_614_all_pids_cn .xlsx`；避免凭旧文件名寻找。
- 更新源资料后，按脚本配置运行 `python scripts/convert_csv.py` 生成PID数据。先核对输入路径，不要覆盖手工修正。
- 小程序通过 `require` 读取JS数据，不改回require JSON。
- Car Scanner导出 `.csp`，LUFI导出二进制INI压缩包；模板与规则在 `docs/examples/`、`docs/obd/`。
- `utils/fileHelper.js` 处理同步保存与分享；云端附件需要先下载，之后再由用户点击触发分享。

### RaceChrono RCZ 导出

OBD选好参数→导出→RaceChrono→“导出 RCZ”。生成 `vehicle_cn7n.rcz`，其中是 `vehicleProfile.json`，可在RaceChrono导入车辆配置。页面七个配置字段仍可单独复制。

- 只导出勾选参数；搜索和分页不会改变导出范围。
- 生成EN自己的PID、OBD请求标头和公式，不复制5N配置的数值。
- 通道编号使用官方数值编码，保留轮位和同类序号。某类通道超过64个编号时分为多个配置，分享 `vehicle_cn7n_profiles.zip`；解压后分别导入各个RCZ。
- 默认协议为11-bit CAN / 500 kbit，快／慢通道按参数类别预设；导入后按实际记录需求调整。设备配对、会话／保活命令和实际读数仍需实车验证。
- `utils/raceChronoExporter.js` 仍提供Markdown生成函数，供开发者生成本地参考文档；小程序按钮不再导出MD。
- 5N页签当前只做入口，尚未接入完整OBD数据；知识库原有 `vehicle_i5n.rcz` 保持原样。
- 格式研究与验证说明：[docs/racechrono-profile-format.md](docs/racechrono-profile-format.md)。


## 8. 验证命令

推荐用一个命令完成全部本地检查：

```powershell
node scripts/check_all.cjs
```

RCZ独立解包验证需要本机安装Python并可执行 `python`。

自动发现 `scripts/test_*.js` 与 `scripts/test_*.cjs`，最后检查包体、JSON编码、路由和资源引用。只检查，不生成正文、不上传文件、不部署云函数；失败会列出脚本并返回非零退出码。当前共19项（含版本提示、OBD车型、RCZ和知识库单处维护测试）。

只改某个功能时，也可运行对应脚本：

```powershell
node scripts/test_wiki.cjs
node scripts/test_knowledge.js
node scripts/test_en_reorg.cjs
node scripts/test_wiki_cloud.cjs
node scripts/test_laps.js
node scripts/test_track_catalog.cjs
node scripts/test_lap_form.cjs
node scripts/test_lap_progress.cjs
node scripts/test_lap_upload.cjs
node scripts/test_lap_detail.cjs
node scripts/test_location.cjs
node scripts/test_media.cjs
node scripts/test_racechrono.js
node scripts/test_rcz.cjs
node scripts/test_obd_models.cjs
node scripts/test_wiki_content.cjs
node scripts/test_exchange.cjs
node scripts/check_package_size.js
```

包体脚本检查源文件、引用、云资源白名单和页面注册；最终编译大小以开发者工具为准。主包不应直接require知识库分包数据。

注意：5N正文重建与EN历史迁移测试是维护工具，不要为了“通过旧测试”把用户确认的新内容改回旧值。旧名称/编号变动应明确调整兼容映射或测试基线。

## 9. 排查常见问题

| 现象 | 优先检查 |
|---|---|
| 图片显示失败 | 资源是否真正上传、相对目录是否一致、`assets.json`是否更新、wikiFiles是否已部署；点“重试加载图片” |
| 修改本地图片却没变化 | 本地只是维护副本，还需要上传到云端；同名文件可能仍有客户端缓存 |
| RC文件第一次点击没有分享 | 等待下载完成，点击“分享 RC 配置文件”；开发工具可能不支持完整微信分享，需真机验证 |
| PDF无法打开 | `document.key`与`files.json`对应关系、云文件是否存在 |
| 汇率获取失败 | `exchangeRates`部署是否完成、云函数访问外部API是否正常；已有缓存时界面会注明 |
| 分享链接打开到错误赛道 | 是否重排了TRACKS；不得直接调整数据库编号 |
| 圈速不接受冒号格式 | 现在采用数字分栏，分、秒、毫秒分别填写，毫秒可空 |
| 视频上传中断 | 网络、页面切后台、文件临时路径和云存储权限；详见上传回归与交接记录 |
| 从上游重新整理5N资料 | build_5n_wiki.py现在只生成docs/generated内候选文件；人工对照合并到knowledge5n.js |
| 页面标题文字没变 | 改的是数据里的name还是页面navigation-bar的title；查第1节 |

项目变化与尚未完成的真机验证见 [HANDOFF.md](HANDOFF.md)，历史记录在 `docs/HANDOFF-history.md`。

配置文件请保存为 **UTF-8（无BOM）**，尤其是页面 `.json`；带BOM会被微信开发者工具报为JSON语法错误。包体检查现已包含包内JSON解析检查。

### 版本更新说明弹窗

在 `data/changelog.js` 最前面增加新版本记录：更新 `version`、`date`、`items`。提示版本号来自这份文件，建议与开发者工具上传时的版本号一致；仅修改文案而不增加version，同版已确认用户不会再次看到。

首次进入任一功能页会显示最新说明，关闭后才记录 `acknowledgedChangelogVersion`；跨版本最多展示三条未读历史。旧版静默写入的 `seenVersion` 不再用于判断，避免实际没看到却被当成已读。

开发者工具重测当前版本：控制台执行 `wx.removeStorageSync('acknowledgedChangelogVersion')`，再重新编译，以清除本次运行的内存记录。无需修改正式版本号或清空其他业务缓存。

### 个人成绩进步记录

圈速榜→“我的成绩”顶部新增“我的进步”。按赛道（布局仍按独立赛道编号）、车辆名称、干地／湿地分组，显示个人最佳圈速、达成日期、首次记录至今累计提升秒数，以及每次刷新最佳的日期、圈速、原厂／改装和已填轮胎。车辆名称按原文去除首尾空格匹配，不推测不同名称是否同一辆车。

同一天有多条成绩时取当天最快一条作为轨迹点；同日内没有时间信息，因此不推断圈与圈的先后。累计提升以首次有记录日期的当天最佳为基准。较慢记录仍保留在下方完整成绩列表，点击轨迹点可查看原成绩详情。

使用现有lapBoard的mine查询逐页加载全部本人公开记录，完成后才计算，避免仅用前20条误称个人最佳；无需新增集合、迁移数据或部署云函数。编辑、删除后重载统计，切换标签时丢弃过期响应。记录很多时首次加载请求数相应增加。
