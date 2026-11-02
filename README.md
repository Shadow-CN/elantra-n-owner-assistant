# 现代 N 车主助手：开发与内容维护指南

原生微信小程序，服务伊兰特 N（EN / CN7N）和 IONIQ 5 N（5N）车主。包含车主 Wiki、圈速榜、OBD 配置导出、压力换算和汇率换算。

**先找文件：不确定改哪里时，先查下面的表格。继续开发请同时阅读 [HANDOFF.md](HANDOFF.md)。**

## 1. 我想改什么，应该找哪个文件？

以下都是相对项目根目录的路径；点击文件链接可以打开。

| 想修改的内容 | 文件 | 修改位置／说明 |
|---|---|---|
| 小程序首页入口、文字、卡片顺序 | [pages/index/index.wxml](pages/index/index.wxml) | 按标签从上到下显示；点击行为在同目录 `index.js` |
| 实用工具列表、工具简介 | [pages/tools/tools.wxml](pages/tools/tools.wxml) | 压力、汇率、轮毂入口；跳转在 `tools.js` |
| 实用工具页背景与卡片样式 | [pages/tools/tools.wxss](pages/tools/tools.wxss) | 已移除右上角径向渐变晕影 |
| EN 分类、文章、零件号、备注、图片顺序 | [knowledgeElantra.js](packages/knowledge/data/knowledgeElantra.js) | 搜索词条标题，例如“钥匙”“脚垫卡扣”“迎宾灯” |
| 5N 分类、文章、表格、图片顺序 | [knowledge5n.js](packages/knowledge/data/knowledge5n.js) | 运行时数据；手工编辑会立即影响编译结果，重建脚本会覆盖该文件 |
| Wiki 首页车型名称、简介、来源链接 | 上面两份数据文件 | 顶部 `name`、`english`、`description`、`sourceLink`、`source`；`english` 不保证单独显示 |
| Wiki 首页标题、分类目录布局、搜索框 | [knowledge.wxml](packages/knowledge/knowledge/knowledge.wxml)、[knowledge.wxss](packages/knowledge/knowledge/knowledge.wxss) | 5N“手册与资料”通过分类05的样式占整行 |
| Wiki 搜索、分类选择、返回行为 | [knowledge.js](packages/knowledge/knowledge/knowledge.js) | 搜索→分类→Wiki目录→上一页；分享直达时提供首页回退 |
| 词条详情页面排版、图片、复制按钮 | [article.wxml](packages/knowledge/article/article.wxml)、[article.wxss](packages/knowledge/article/article.wxss) | 行为在同目录 `article.js` |
| Wiki 词条ID、搜索匹配、关联文章 | [wiki.js](packages/knowledge/lib/wiki.js) | ID由分类ID和文章标题生成；改标题需要保留旧ID到 `aliases` |
| 知识库图片加载、临时链接缓存、附件下载 | [media.js](packages/knowledge/lib/media.js) | 从云函数获取链接；图片失败可重试；附件先下载再点击分享 |
| 图片和RC附件的云端位置 | [assets.json](cloudfunctions/wikiFiles/assets.json) | 逻辑路径→永久cloud fileID白名单；不要写临时签名URL |
| PDF手册文件名和资料入口 | EN/5N数据文件的 `document` | `name` 为文件名，`key` 对应下方PDF白名单 |
| PDF实际云文件ID | [files.json](cloudfunctions/wikiFiles/files.json) | 当前含EN中文手册、5N手册、ETC手册 |
| 腾讯文档链接 | EN数据中 `experience` 分类的 `externalLink` | `url`为复制备用链接，`shortLink`为腾讯文档小程序直达链接 |
| 圈速榜页面、表单文字、成绩列表布局 | [pages/laps/laps.wxml](pages/laps/laps.wxml) | 样式在 `laps.wxss`，行为在 `laps.js` |
| 圈速输入、上传、编辑、删除、分享 | [pages/laps/laps.js](pages/laps/laps.js) | 分／秒／毫秒；毫秒选填；视频和视频链接选填 |
| 成绩详情页 | [pages/lap-detail/lap-detail.wxml](pages/lap-detail/lap-detail.wxml) | 视频／外链→基础信息→改装项；行为在同目录JS |
| 赛道名称、改装字段、输入校验 | [utils/laps.js](utils/laps.js) | `TRACKS`、`MOD_FIELDS`、`validate` |
| 云端成绩校验 | [validation.js](cloudfunctions/lapBoard/validation.js) | 必须与 `utils/laps.js` 一致，改后部署 `lapBoard` |
| 地区、地区包含哪些赛道、拼音顺序 | [pages/laps/laps.js](pages/laps/laps.js) | `REGIONS`、`REGION_TRACKS`、`REGION_PINYIN`、`TRACK_PINYIN` |
| 自动定位推荐 | [trackLocation.js](utils/trackLocation.js) | 本地省界匹配，不上传坐标；地区编号与圈速页保持一致 |
| 成绩数据库查询／权限／视频清理 | [lapBoard/index.js](cloudfunctions/lapBoard/index.js) | 操作 `lap_records`，归属检查由云端执行 |
| 压力换算内容、默认参考值 | [pages/tire/tire.js](pages/tire/tire.js)、[tire.wxml](pages/tire/tire.wxml) | 不是圈速榜温度字段 |
| 汇率页面和交互 | [pages/exchange/exchange.js](pages/exchange/exchange.js)、[exchange.wxml](pages/exchange/exchange.wxml) | 金额、币种、交换、刷新、缓存提示 |
| 支持哪些币种、金额计算规则 | [utils/exchange.js](utils/exchange.js) | `CURRENCIES`；增币种需同时更新云端 `rates.js` |
| 汇率API与数据校验 | [rates.js](cloudfunctions/exchangeRates/rates.js) | 固定从Frankfurter取每日参考汇率，不接受用户传任意URL |
| 汇率缓存、失败回退 | [exchangeRates/index.js](cloudfunctions/exchangeRates/index.js) | 服务端6小时缓存，本地保留最近成功数据，最多7天；界面显示缓存状态 |
| OBD中文名、PID、单位等运行时数据 | [data/pids.js](data/pids.js) | 大文件，先搜索参数名；数据生成说明见下文 |
| OBD筛选、参数选择 | `pages/filter/`、`pages/params/` | 数据工具代码位于 `utils/` |
| Car Scanner / LUFI导出 | `pages/export/` | `.csp`与LUFI二进制INI压缩包 |
| RaceChrono导出工具 | `pages/racechrono/`、[raceChronoExporter.js](utils/raceChronoExporter.js) | 与5N Wiki内的RC附件入口是两个用途 |
| 全局颜色和深浅模式 | [app.wxss](app.wxss)、[theme.js](utils/theme.js) | auto→dark→light；页面通过主题变量取色 |
| 页面最上面的标题 | 对应页面 `.wxml` 中的 `<navigation-bar title="…">` | 例如“车主 Wiki”“赛道圈速榜”，不是数据文件里的车型名称 |
| 顶部导航栏、左上角箭头 | `components/navigation-bar/` | Wiki用delta=0由页面处理返回；其他页面通常默认原生返回 |
| 微信分享标题和通用路径 | [utils/share.js](utils/share.js) | Wiki和圈速榜另有动态分享回调 |
| 新增页面注册 | [app.json](app.json) | 主包写 `pages`，知识库写 `subPackages` |
| 云开发环境初始化 | [app.js](app.js) | `wx.cloud.init` |
| 哪些文件不打包 | [project.config.json](project.config.json) | `packOptions.ignore`，勿误删知识库资源排除规则 |
| 本机开发者工具偏好 | `project.private.config.json` | 仅本地保留，不提交Git |

## 2. 修改知识库正文和零件号

EN直接修改 `packages/knowledge/data/knowledgeElantra.js`。5N运行时数据在同目录 `knowledge5n.js`。

```js
{
  "title": "词条标题",
  "summary": "列表中显示的简短介绍",
  "parts": [{
    "name": "配件名称",
    "brand": "品牌（没有可留空）",
    "codes": ["零件编号"],
    "note": "适配或订购备注"
  }],
  "lines": ["配件名称 零件编号", "正文说明"],
  "partLineIndexes": [0]
}
```

- `codes` 是点击复制的编号；`lines` 用于全文复制和搜索，也要同步更新。
- `partLineIndexes: [0]` 表示正文不重复显示第0行，因为上方已单独展示零件号。
- 简单词条显示 `lines`；存在 `blocks` 时，正文按 `blocks` 排版。所以有图文排版的文章，改文字需同步 `lines` 和对应 `blocks[].text`。
- `images` 数组按顺序展示；若另有 `image`，该单图会先展示。
- 图文交错词条按 `blocks` 中 `type: 'image'` 的顺序显示，`images` 也要维护同一浏览顺序。
- 目前迎宾灯按“产品与效果／门板安装位置／取电与开关效果／灯体实拍”排列；脚垫卡扣按安装示意→原参考图→特写→安装实拍排列。
- 分类ID不要随意改变。文章改名时，把原分享ID放入 `aliases`，避免旧链接失效。

### 5N生成脚本有什么用？

`scripts/build_5n_wiki.py` 读取本地 `ioniq_5n_china_owner_wiki-main/docs` 的Markdown，生成小程序JS数据和来源清单。小程序本身不运行Python。

**它会覆盖 `knowledge5n.js`。如果你直接改过JS，先保存并核对这些修改，不能直接运行脚本重建。** 本次云资源迁移保留了数据中的逻辑图片路径，因此不需要重新生成5N正文。

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

成绩数据库保存的是赛道数组编号，**只能追加，不要重排或复用已有编号**。

1. `utils/laps.js` 的 `TRACKS` 末尾追加赛道名称。
2. `cloudfunctions/lapBoard/validation.js` 同步完全相同的内容。
3. `pages/laps/laps.js` 的 `REGION_TRACKS` 把新编号归入对应地区。
4. 同文件 `TRACK_PINYIN` 增加对应拼音键，决定下拉选项顺序。
5. 新增地区时，在 `REGIONS` 与 `REGION_PINYIN` 末尾追加，并同步 `utils/trackLocation.js` 的地区数组；编号顺序必须一致。
6. 部署 `lapBoard` 并编译。

现有V1：编号11为2.4km，编号19为4.29km。界面按拼音排序，存储编号不随显示顺序变化。分享链接带赛道编号，自动定位不会覆盖分享指定的赛道。

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

## 8. 验证命令

```powershell
node scripts/test_wiki.cjs
node scripts/test_knowledge.js
node scripts/test_en_reorg.cjs
node scripts/test_wiki_cloud.cjs
node scripts/test_laps.js
node scripts/test_lap_form.cjs
node scripts/test_lap_upload.cjs
node scripts/test_lap_detail.cjs
node scripts/test_location.cjs
node scripts/test_media.cjs
node scripts/test_racechrono.js
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
| 修改5N文字被覆盖 | 是否运行了build_5n_wiki.py；从Git/备份找回后同步生成规则 |
| 页面标题文字没变 | 改的是数据里的name还是页面navigation-bar的title；查第1节 |

项目变化与尚未完成的真机验证见 [HANDOFF.md](HANDOFF.md)，历史记录在 `docs/HANDOFF-history.md`。

配置文件请保存为 **UTF-8（无BOM）**，尤其是页面 `.json`；带BOM会被微信开发者工具报为JSON语法错误。包体检查现已包含包内JSON解析检查。
