# 项目交接：HN / 现代 N 车主助手

更新时间：2026-11-01（Asia/Shanghai）。新聊天请先阅读本文件，再按当前用户要求继续；这里的最新约定优先于旧说明文件中的历史描述。

## 2026-11-02 5N手册与RaceChrono附件（最新）

- 5N分类05改名“手册与资料”，保持整行入口。RaceChrono OBD配置文件不再单独列在手册分类，resource移入“常见问题 → RaceChrono读取不到OBD数据流”；旧配置文章ID与alias转到该词条。文件原件仍在原资源路径。
- scripts/build_5n_wiki.py同步迁移规则，重建不会覆盖本轮改动。运行时目录/词条在packages/knowledge/data/knowledge5n.js；本地上游Markdown未改。相关Wiki和页面检查通过。

## 2026-11-02 统一目录与返回层级（最新）

- EN/5N首页分类均使用EN的双列网格，移除5N专属单列分类样式，保留5N无正文节选的词条列表。
- Wiki导航使用delta=0与bind:back由页面处理：有搜索先清搜索，有分类返回当前车型目录，目录再返回上一个页面；分享直达无上页时reLaunch到小程序首页。详情页保持原生返回，回到原分类状态。知识库首页/查看全部分类同时清空搜索。

## 2026-11-02 5N展示调整（最新）

- 原有5分类、词条顺序、正文和来源数据不变。首页只展示独立的单列分类卡片；分类/搜索结果才展示词条列表。去掉5N列表的正文节选，显示完整标题和图片/文件类型提示；搜索结果用边框与标题栏区分模块。EN展示保持现状。

## 2026-11-02 EN Wiki目录重组（最新）

- 用户已确认按最新六分类方案实施，覆盖旧的“先讨论、不重排”限制。EN首页现在为搜索、六分类目录（用户认为三个常用入口重复，已移除快捷按钮）；不再默认铺开所有文章，选择分类或搜索后显示列表。5N保持原目录和列表。
- 六分类：保养与规格、零件查询、轮胎与赛道、车机与功能、故障与经验、手册与资料；价格与渠道参考单独在首页下方，含8篇历史资料。总词条33篇。
- 拆分混合零件和NP滤芯/雨刮器；机油规格与价格分离；明确DCT、ECU/TCU和工程模式标题。零件名/编号、图片、PDF、旧词条ID与原alias均保留。旧分类01–11通过section.aliases解析。
- wiki.related支持显式relatedIds，EN显示“关联词条”；5N继续默认同分类。原始内容快照docs/en-wiki-before-reorg.json仅用于恢复/校验，不是运行时数据。正文仍在packages/knowledge/data/knowledgeElantra.js修改。
- 保留用户的车型名称、来源链接及来源文案。来源URL点击复制，已按用户意愿移除“点击复制链接”提示文字。
- test_wiki、test_knowledge、test_en_reorg及包体检查通过。开发者工具已实际打开新首页并截图docs/en-wiki-reorganized.png，未改云端数据。

## 2026-11-02 Wiki首页来源链接可复制（最新）

- 用户自行修改了EN/5N的name、english、description和source文案，操作时已保留这些修改。两个来源链接分别为 `https://carplay.66ir.com/cn7n.html#manual` 和 `https://5nwiki.antarescorn.fyi/`。
- 现将URL从description里拆出为独立 `sourceLink:{label,url}`，description只保留简介；首页下方单独显示来源名称、加粗URL和“点击复制链接”，点击调用onSourceLinkTap仅复制URL（保留#manual），切换车型同步更换。
- 暂未实现跳转外站，用户明确保留后期点击跳转设想。URL和事件入口独立，后续接web-view前仍需满足域名/平台条件。
- `scripts/build_5n_wiki.py` 元数据已同步最新中文名称、NE1N、德国鸡腿堡来源文案与sourceLink，避免以后构建覆盖。只改脚本元数据，本轮未重新生成整套5N正文。
- test_knowledge、test_wiki、包体检查及生成脚本语法检查通过；模拟器核对EN/5N的sourceLink与入口，截图docs/wiki-en-source-link.png和wiki-5n-source-link.png。

## 2026-11-02 EN中文车主手册PDF

- 用户明确提供 `C:/Users/MSI/Downloads/a640716bffe4f1af14f583e72aac4e.pdf` 并要求加入知识库。原件只读保留，不重写、不压缩。
- 461页、16,564,471字节（16.56MB），SHA256 `119A37C7FF6EAB7B868696B58B7F1A0935A6DC16DDE32BF81C7EDF907DAB7E62`。已渲染核对中文“车主手册（使用说明书）”封面。未依据文件创建日期推断车型年份。
- EN section09“维修手册”新增“车主手册（中文 PDF）”，EN总词条25。原英文维修手册保留，整体目录未重排。
- 使用既有article.document阅读路径，key `en-owner-manual`，文件名“伊兰特N车主手册.pdf”。wikiFiles/files.json已增加永久fileID白名单。
- 目标云路径 `knowledge/en/manual/elantra-n-owner-manual-cn.pdf`。上传工具触发微信开发者工具的内置确认，taskId `confirmation_cloud_manage_storage_e18c2e1f-482b-4233-bf36-4dbc9e434784`；上传确认已成功执行，wikiFiles也已部署成功（3files，957B）。真实小程序下载返回成功，大小16,564,471字节，MD5与原件一致（5da640716bffe4f1af14f583e72aac4e）。模拟器词条及PDF打开按钮显示已检查，截图docs/en-owner-manual-entry.png。

## 2026-11-02 EN Wiki梳理（用户要求先讨论，不急于改）

- 用户认为EN知识库乱，希望重梳理但暂不重排，并提供 https://www.hexorcism.com/22CN7N/ ，称为23款英文维修手册。
- 发现此URL原已在section09“维修手册”中。只将既有词条明确命名为“23款英文维修手册”，保留旧ID s09-hkrioj为alias，未重复添加，EN仍为24词条。网页标题CN7-N Shop Manual v22.1121f；23款按用户提供标注，不宣称已从站点验证全部适配。
- `docs/en-wiki-outline.md` 为讨论草案：七个入口、现有混杂点、词条组织建议和后续小范围试排流程。目录重排、拆条目、技术核实和报价整理尚未执行，不得擅自按草案批量改。
- 手册仍是点击网址复制入口，没有外站web-view/整站镜像。5N未改动。

## 2026-11-02 独立成绩详情页（最新交互）

- 用户要求点击成绩进入新详情页，顺序固定：顶部视频/视频链接 → 基础信息 → 改装项。已新增 `pages/lap-detail/lap-detail.{js,wxml,wxss,json}` 并注册app.json。
- 圈速榜和“我的成绩”的成绩行、改装标签均通过navigateTo按记录ID打开独立页，原列表内嵌详情与改装详情已移除。“我的成绩”原有编辑/删除按钮保留。
- 新云函数action `detail` 按ID仅返回已发布成绩的公开白名单字段；不返回owner/fileID/path/cleanup字段，未发布/删除记录不可查看。已部署lapBoard，原video接口继续提供临时视频地址。
- 新页直接按ID取数据，不依赖列表临时缓存；链接单独提交的成绩无需请求云视频，无视频有占位。视频加载失败不影响基础/改装信息，并可重试获取视频地址。链接复制/小程序链接跳转与失败回退已迁移到新页。
- 继承首页主题循环，原厂显示原厂，改装但无详情有空态；刹车卡钳/刹车皮及历史brakes均正确展示。
- 新增 `node scripts/test_lap_detail.cjs`；laps/lap_form/lap_upload/location及包体检查通过，主包约1.59MiB。实际模拟器已按ID只读打开现有云成绩，顶部原视频与基础信息显示正常；截图 `docs/lap-standalone-detail.png`。未修改既有云成绩。
- 新页面初次导航报page not found，为开发工具缓存；close_project_window → open_project_window → simulator_open_page后再navigateTo恢复，不是缺文件。

## 2026-11-02 改装刹车字段拆分

- 用户要求把“刹车”拆为“刹车卡钳”（brakeCalipers）和“刹车皮”（brakePads），都选填。顺序：轮胎、轮毂尺寸、刹车卡钳、刹车皮、避震、进气、涡轮、排气、ECU、TCU、轻量化。
- 前后端校验同步，新记录不再出现合并的brakes输入。历史brakes原文不猜测迁移、不丢弃；有值时在详情/编辑表单显示“刹车（旧记录）”，可保留或自行整理到新字段后清空。
- 没有执行数据库批量迁移。lapBoard已部署成功（3files，4.9KB），对应回归测试及原生模板编译通过。

## 最新追加：社交平台视频链接及跳转边界

- 后续B站真实示例 `BV12g8t6NEWo` 也已核对：原分享文案解析通过，HTTP301→200 HTML，公开页未找到微信小程序跳转参数。当前仍为复制回退，尚无真实B站小程序链接的跳转验证。见 `docs/lap-video-links.md`。

- 用户已提供真实抖音短链 `https://v.douyin.com/tJeyV1wK-u8/`，完整文案解析通过；只读HTTP确认最终是 www.douyin.com 的HTML视频分享页，不是小程序链接或直链。当前按复制回退处理，具体记录在 `docs/lap-video-links.md`，未完成真机打开验证。

- 视频区域新增“视频链接（选填）”，可粘贴完整HTTP(S)链接或含一个链接的分享文案（最多4096字），保存解析后的链接到 `lap_records.videoLink`（最多2048字）。前后端同份校验：`normalizeVideoLink`。
- 上传文件与视频链接各自可选，可只填链接、只上传文件、同时提供或全部留空；链接单独提交不调用uploadFile。没有抓取链接内容、下载外站视频或转存。
- 成绩列表投影增加videoLink；详情显示可选中链接与“复制视频链接”按钮，提示到对应平台/浏览器粘贴。未实现任意外站网页在小程序内打开。
- 编辑回填/修改/清空链接，保存成功清空表单链接。旧成绩缺少字段按空处理。链接仅详情展示，无云视频时不会一直显示“正在获取视频”。
- 用户最新要求：以后希望小程序内播放，现在优先能跳转则跳转、失败复制。已增加 `#小程序://…` 小程序链接支持，以官方 `wx.navigateToMiniProgram({shortLink})` 打开，失败提供复制回退，取消不自动复制；普通HTTP(S)链接当前仅复制。没有伪造平台appId/path，也没有通用App唤起或第三方视频解析。
- 完整边界及未来内嵌播放条件记录在 `docs/lap-video-links.md`；已询问用户提供真实常用视频分享链接，仍待真机验证。
- 云函数新增字段及最新小程序链接格式校验均已部署成功（lapBoard，3files，4.8KB）。原生模板编译和模拟器视频链接输入框检查通过，当前仍无真实平台链接的跳转/播放验证。

## 最新追加：数字分栏与内蒙古赛道

- 2026-11-02 用户真机截图反馈秒框右边线断裂/输入框过大：三栏整体最大宽度改560rpx、高88rpx、字36rpx；移除gap，以固定分隔符宽度分配空间；输入列零基宽允许收缩。边框和圆角改画在 `.lap-input-frame` 外层，原生input内部不带border/padding，避免iOS原生输入渲染覆盖边线。真机效果仍需用户复验。

- 用户已选择实际应用“数字分栏”，不是继续保留单输入框，也不是滚轮。`pages/laps` 已改为分/秒/毫秒三个 `type=number` 输入，只填数字，毫秒选填；例如分01秒17毫秒留空保存01:17.000，毫秒填1保存为001（1毫秒）。
- 页面 `_lapValue` 合成标准圈速，编辑回填拆分已有圈速，保存成功及取消编辑清空三栏；拒绝全空/全零/秒>=60，上传失败保留三栏。现有后端格式不变。
- 新增“内蒙古 → 鄂尔多斯国际赛车场”：TRACKS末尾稳定ID10，页面地区末尾index6，既有赛道/地区编号均未重排。`utils/trackLocation.js` 推荐映射已同步，内蒙古模糊定位优先选择此赛道。
- 前后端赛道数组已同步，lapBoard已通过CLI部署成功。模拟器实际页面已显示新赛道与分栏输入，截图 `docs/lap-split-input-preview.png`。

## 2026-11-01 圈速输入与上传排查补充（最新）

- 用户反馈：圈速总提示填写 `01:32.456`；选视频后提交报 `cloud.uploadFile:fail undefined / uploadFile:fail interrupted`。
- 原解析器只接受半角冒号、两位秒、三位毫秒，前端输入长度仅9。现在兼容全角数字/冒号/句点、1—3位小数、总秒数（`92.456`），规范保存为 `01:32.456`。仍拒绝秒数>=60、负数、零、超过三位小数以及>=100分钟。前端最大长度32并补blur事件。
- `utils/laps.js` 与 `cloudfunctions/lapBoard/validation.js` 已同步，提交前采用校验返回值。**本次云函数校验修改已通过 CLI 部署成功**（lapBoard，3 files，4.3KB），前后端均已更新。
- `app.json` 的 networkTimeout.uploadFile 设置600000ms（10分钟），并在上传期间尝试保持屏幕常亮；这些不能保证任意大文件上传成功或后台继续上传。
- 上传前只检查文件access，不读整个视频、不压缩、不修改原件。文件失效提示重新选择；中断/超时明确提示并保留表单及上传intent。后端保存失败仍复用已成功上传的fileID。
- 控制台日志 `[laps] video upload failed` 记录错误码、耗时、进度、字节数与是否曾进入后台，不记录路径/临时链接/凭据。
- 新增 `node scripts/test_lap_upload.cjs` 验证完整提交/上传中断/重试/保存失败复用/文件不可读/无视频及页面卸载；与 laps/media/lap_form/location/package检查均通过。主包约1.57MiB。
- 最初 MCP 连接失败；CLI 部署时恢复 IDE server（44890），随后原 MCP 授权可用，不再需要用户提供新token。模拟器旧上传报错日志已清空，尚未收到用户具体输入/设备/视频大小回复。模板编译通过；模拟器实际云存储小文本上传成功并立即删除（1.9秒）。**未验证手机上传恢复，不能声称用户原报错根因已解决。**

- 本次尝试将用户9.04MB原视频只读分段复制到模拟器，以实测视频上传；在约4MB后被模拟器 `fs_appendFileSync:fail the maximum size of the file storage limit is exceeded` 阻止，尚未进入云上传。该测试副本在finally中删除，H盘原视频没有写入操作。不要把此配额错误直接当作用户 interrupted 的根因。

## 1. 最新操作与当前任务

- 用户最新确认：**G70 高压油泵为 `35320 2GTA0`，高压油泵垫片为 `35320 2GTA1`**。已同步修复 EN 数据的 `lines` 和 `parts.codes`，移除“仅尾号／完整编号待补充”。这是用户提供的更正，没有擅自改成其他前缀。
- 用户要求在上下文将满时整理交接文档。本文件即交接结果。
- 此前明确要求的开发修改已实现；主要剩余的是手机真机验证、后台配置核对、后续用户反馈。不要将“视频大文件上传已经通过”当成事实。
- 全部修改尚未由本次聊天提交 Git；不要擅自提交、推送、上线或清理无关改动。

## 2. 环境与运行

- 工作区：`D:/WeChatProjects/Elantra N OBD stats`，原生微信小程序，PowerShell，Node 与 Python 已安装。
- AppID：`wx113792b30d798c93`。
- 已开通微信云开发，环境：`hn-owner-asst-d7gufu33n85700993`。用户截图为每月 40,000 资源点套餐。
- 云函数目录：`cloudfunctions/`，已在 project.config.json 声明 cloudfunctionRoot；云函数目录不打进小程序。
- 微信开发者工具安装目录：`D:/微信web开发者工具`，CLI：`cli.bat`，MCP 入口：`wechatide.cmd mcp`。
- 最近服务端口是 **44890**。CLI 与 MCP 的访问密钥不同；不要把 MCP token 当成 CLI token。密钥可能刷新，本文件不保存任何密钥、临时签名链接或凭据；需要时让用户从「设置 → 安全设置」提供当前值。
- `scripts/wechat_mcp.cjs` 可连接已开启的开发者工具 MCP。它从 `WECHAT_DEVTOOLS_CLI_TOKEN` 环境变量取 MCP token，接收一个 tools/call 请求 JSON 文件路径；不传参数可列工具。它会启动短期 stdio bridge，45秒超时。
- 注意存储工具结果可能带签名 URL 和临时凭据，后续调用应筛选输出，不要把整份响应写入说明文档或最终答复。
- 本机默认沙箱终端和 node_repl/CUA 曾反复报 Windows sandbox `helper_unknown_error: setup refresh had errors`。经允许的 `exec_command` require_escalated 可正常读写当前项目和运行 CLI。不需要再让用户重启电脑。电脑操作内核曾不可用，优先用 CLI/MCP。
- `git` 报 dubious ownership 时，用单次 `git -c safe.directory='D:/WeChatProjects/Elantra N OBD stats' ...`，没有修改全局 safe.directory。

## 3. 工作区已有改动，勿覆盖

本轮开始时工作区就有大量修改、删除和未跟踪文件，包括知识库从主包迁到 packages、旧图片路径删除、Excel 文件名差异、OBD/LUFI BATTVOLT 相关工作、README、theme 等。`git status` 仍然很脏，不能把全部差异都归为本聊天产物，更不能 reset/clean 或恢复所有删除文件。

用户原始视频与原始 5N 文档始终保留。除本聊天明确生成的临时请求文件之外，没有清理用户文件。

## 4. 关键文件速查

| 内容 | 文件/目录（相对工作区） |
| --- | --- |
| 首页入口、首页导航标题 | `pages/index/index.wxml`、`pages/index/index.js` |
| 应用/分包/权限配置、云环境初始化 | `app.json`、`app.js`、`project.config.json` |
| 全局主题 | `utils/theme.js`、`app.wxss`、`components/navigation-bar/` |
| 圈速榜前端 | `pages/laps/laps.js`、`.wxml`、`.wxss`、`.json` |
| 圈速表单、赛道、改装详情字段及校验 | `utils/laps.js` |
| 云端成绩接口与同份校验 | `cloudfunctions/lapBoard/index.js`、`validation.js` |
| 本地省份定位/推荐 | `utils/trackLocation.js`、`data/location/provinces.js` |
| Wiki 目录与搜索 | `packages/knowledge/knowledge/knowledge.*` |
| Wiki 独立词条、正文/编号复制、PDF 查看 | `packages/knowledge/article/article.*` |
| Wiki 索引/稳定 ID/搜索/旧链接兼容 | `packages/knowledge/lib/wiki.js` |
| **EN 全部知识和配件数据** | **`packages/knowledge/data/knowledgeElantra.js`** |
| **5N 原文资料** | **`ioniq_5n_china_owner_wiki-main/docs/`** |
| 5N 小程序生成数据 | `packages/knowledge/data/knowledge5n.js` |
| 5N 同步脚本、源文件摘要 | `scripts/build_5n_wiki.py`、`docs/5n-wiki-source-manifest.json` |
| 5N 图片/RC 附件 | `packages/knowledge/assets/knowledge/ioniq5n/` |
| PDF 白名单只读云函数/文件 ID | `cloudfunctions/wikiFiles/index.js`、`files.json` |
| 旧的知识库主包入口 | `pages/knowledge/knowledge.*`，此前已有迁移兼容，不要随意删除 |
| 补充说明（含历史过程，后面的更新为准） | `docs/lap-board-setup.md`、`docs/wiki-reading.md` |

## 5. Wiki：用户最终偏好与实现

用户选择的是**百科式阅读**，不是多人编辑。结构为车型 → 分类目录 → 独立词条，支持搜索、页内目录、同分类跳转、单篇分享、图片预览、复制、文件入口。没有协作编辑/版本历史，也没有虚构更新时间与编辑次数。

### EN

- 数据源 `knowledgeElantra.js`，11类、24篇。
- `lines` 保留原文，用于搜索和整篇复制；`parts` 为显式结构化配件行：`name`、`brand`、`codes`、`note`。
- `partLineIndexes` 标出已被结构化呈现的原文行，页面不重复展示这些行，但搜索和整篇复制仍含原文。
- **修改某个零件号时必须同步 `lines` 和 `parts.codes`。**不要仅改显示数据而让搜索/整篇复制仍包含旧错误。
- 配件名/品牌与零件号分层；编号使用等宽字体和独立按钮。点击编号只复制原编号，保留空格/斜杠/连字符。
- 已恢复普通正文逐行点击复制，5N 表格单元格也可点击复制。
- 不要再丢掉点击复制，不要擅自将相似车型的编号合并或推测完整前缀。

### 5N

- 用户明确要求按指定原 Wiki 整理，不沿用之前拆写的摘要。
- 原目录顺序：充电；方向盘、仪表、车机、中控；保养、维护、改装；常见问题；有用的文件。
- 运行 `python scripts/build_5n_wiki.py` 从原 Markdown 生成 `knowledge5n.js`；当前26篇，保留原文、列表层级、图文上下文顺序、19张图、四轮定位表、两张 OBD 通道表、章节链接。
- 修改 5N 原文应先修改 `ioniq_5n_china_owner_wiki-main/docs/<章节>/index.md`，再运行同步脚本。不要只改生成文件，下一次构建会覆盖。
- 原图有预处理后的 JPEG。若新增/替换图片，检查 `scripts/prepare_5n_assets.ps1` 并确认分包预算；原图目录不在小程序包内。
- 词条 ID 由分类 ID + 标题散列生成，条目重排不变；旧版拆写条目的 ID 经 aliases 映射至原章节，避免分享链接失效。更改标题/分类时要维护兼容。

### 5N 文件

- 原始文件位于 `ioniq_5n_china_owner_wiki-main/docs/public/manual/`。
- `5n manual.pdf`：24,472,627 字节；`ETC.pdf`：2,324,875 字节。太大，不能直接打进分包。
- 用户已在开发者工具确认上传，两份文件在云存储 `knowledge/5n/manual/5n-manual.pdf`、`knowledge/5n/manual/etc-manual.pdf`。
- `wikiFiles` 云函数已部署，按 `files.json` 白名单提供临时链接，不接受任意文件路径。
- 实测小程序 `wx.downloadFile` 两份均返回200，字节数与原文件一致；未列入白名单的 key 被拒绝。前端提供 `wx.openDocument` PDF 查看入口。
- `vehicle_i5n.rcz`（591字节）仍在分包内；读取/分享测试通过。
- 没有删除或改写原 PDF/RC 文件。云端资料未在微信正式版发布流程中上线，代码仍需正常预览/上传/提审。

## 6. 圈速榜：最新约定

- 用户手填成绩，**不设人工审核，提交即上榜**；标注为车友自报。
- 字段：车手昵称、日期、圈速、车型、路面干/湿、车辆状态原厂/改装；气温**选填**，空值为 null、显示未填气温，0℃有效。
- 车辆状态有必填星号，默认原厂。
- 昵称用 `input type=nickname`，用户可在手机键盘上点“用微信昵称”，也可手填；不能静默读取微信名，不使用旧 getUserProfile 获取真实昵称。保留 input/blur 值同步。
- 改装详情十项全选填，可只标记改装：轮胎 → 轮毂尺寸 → 刹车 → 避震 → 进气 → 涡轮 → 排气 → ECU → TCU → 轻量化。
- 榜单只显示原厂或改装标签，点击**改装**后显示具体详情；不要默认展开全部。
- 视频**选填**，使用 `wx.chooseMedia`、原视频上传，**无业务大小上限、不主动压缩**。旧的500MB及自动压缩方案已被用户后续指令取消。
- 上传用 `wx.cloud.uploadFile`，有进度；平台/设备仍可能限制大文件，不保证任意大小。未实现分块上传或断点续传。
- 圈速保存毫秒排序。当前展示每条成绩，不按个人最佳去重。
- 本人可编辑/删除/更换视频，云函数从 getWXContext().OPENID 检查归属；version 条件更新避免覆盖并发改动。
- 更换视频先保存新关联再删除旧文件；删除先下榜、清理成功后移除记录。清理失败返回 cleanupPending，保留记录供管理员处理，**没有自动清理重试任务**。
- 上传/发布失败重试复用已上传 fileID 和记录 ID，减少重复上传。离开页面/换文件仍可能留 uploading 草稿与孤立文件，需后续清理设计。

### 赛道

地区 → 赛道两级选择，没有独立布局字段；需要区别布局时直接写在赛道名内。

现有数组 ID 不要随意重排：
0 北京锐思；1 北京易车金港；2 浙江国际；3 宁波国际；4 上海天马；5 上海国际；6 成都天府国际；7 广东竞速国际（麻涌）；8 纽博格林北环完整圈20.832km；9 纽博格林北环BTG桥到龙门架。

德国只保留完整圈与BTG，用户明确不加入20.6km/NLS/24小时组合。

### 自动定位推荐

- 用户要进入页面自动推荐，不要“按位置推荐”按钮；按钮已移除。
- 每个应用会话自动尝试一次；先隐私同意，再微信模糊定位。失败/拒绝/无法匹配时仍可手动选择。
- 只调用 `wx.getFuzzyLocation({type:'gcj02'})`；app.json 已声明 scope.userFuzzyLocation 用途和 requiredPrivateInfos。
- 省份识别完全本地，使用随包公开省界 `data/location/provinces.js`（约520KB），不把用户坐标上传云函数/第三方地图，不保存坐标，不做导航，不需要腾讯地图Key。
- 曾提议腾讯地图逆地址解析，但自动审批拒绝未明确授权的坐标外发；该方案未执行。后续不要未经用户明确同意改回坐标外发方案。
- 同省有赛道时默认选择该地区第一条；无同省时按省份中心大致距离推荐附近已收录地区。**不是精确最近赛道/驾车距离排序**。模糊位置、省界附近可手动更正。
- 定位异步结果不能覆盖用户已手选或编辑中的记录，已有测试。
- 后台 `wx.getFuzzyLocation` 是否完成开通，仍需确认；截图曾显示未获取位置，不能宣布真机定位已通过。

## 7. 云端与隐私状态

- 已部署：`lapBoard`、`wikiFiles`。
- 数据集合：`lap_records`。用户已按提示设置所有用户不可读写；实测客户端直接读取返回 -502003，而云函数查询/提交/编辑/删除正常。
- 索引 `lap_board_track`：status,track,lapMs,_id 升序；`lap_mine`：status,owner,lapMs,_id 升序。历史含layout的旧索引可能仍在，无需为本任务擅自删除。
- 成绩云端真实测试：无视频提交、编辑、版本过期拒绝、删除通过，测试记录已清理。
- 视频存储规则仍需按实际环境核实，不能开放任意用户写其他人的文件。
- 媒体选择前使用 wx.getPrivacySetting；未同意则显示隐私指引，打开全文用 wx.openPrivacyContract，同意必须来自官方 agreePrivacyAuthorization 按钮事件，不替用户同意。
- 用户拒绝隐私授权不丢表单，可以无视频提交。
- 旧代码把全部 chooseMedia 失败都提示成相册权限，已修复为区分取消、隐私声明缺失、隐私拒绝、系统权限、小程序权限和一般错误。
- 模拟器曾查到相册/摄像头/麦克风系统权限 authorized，但 needAuthorization=true；这不等于知道用户手机的实际权限。
- 当前隐私声明需按实用功能核对：位置信息、选中的照片或视频、摄像头、麦克风（拍摄声音）、发布内容；加入微信昵称填写后还要用户信息（微信昵称/头像）这一类型，用途仅写昵称，不获取头像。
- 不保存媒体回手机相册，所以不要申请“相册（仅写入）”。不要把保存相册权限误当选择媒体权限。
- 已存在 wx.setClipboardData 复制功能，后续若复制失败需读取实际错误并核对相应声明，不要猜成相册权限。

## 8. 主题与UI约定

- 全局 themeMode：auto/dark/light；所有已改页面与首页一致，**点图标直接 auto → dark → light → auto**，不弹主题选择菜单。
- 原先全局保存为 dark，圈速页没有开关所以看似只有深色。现在已补开关。
- 开发工具“生成darkmode适配”会生成 `*-wxa-auto-dark.wxss`，并不负责产品里的手动切换入口。
- 生成文件曾把主题图标和返回箭头强制纯黑，已停用 app、圈速页、导航栏对应自动样式 import，文件保留。不要重新引入覆盖现有 page-meta/CSS变量主题逻辑。
- 已实测浅/深模式截图。以 utils/theme.js 为统一配色来源。

## 9. 测试与验证

在工作区运行：

```powershell
node scripts/test_laps.js
node scripts/test_media.cjs
node scripts/test_location.cjs
node scripts/test_lap_form.cjs
node scripts/test_knowledge.js
node scripts/test_wiki.cjs
node scripts/check_package_size.js
```

- 最近这些测试分别覆盖：表单/归属/版本/视频替换清理；媒体授权；本地省份/手选竞态；主题循环；车型内容隔离/19张图/附件；原Wiki结构/表格/旧链接/编号精准复制。
- 最近包体：主包约1.55MiB、知识库分包约1.01MiB，均低于2MiB；新增大文件先运行预算检查。
- 微信模板编译通过；实际模拟器看过目录、EN编号、5N原文表格、浅深表单。截图在 docs/，不打包。
- 已有说明文件含历史过程，不要把后续被取消的设计再实现回来。
- 开发者工具对新增分包页面曾误报 JSON 文件缺失，实际文件存在。清文件/编译缓存未立刻解决，重新打开项目窗口后恢复。不要据此删除新页面或重写路由。
- CLI close/open 是异步，刚打开可能无runtime；MCP open_project_window + simulator_open_page 后再导航。优先 waitForSelector/有界等待，避免频繁轮询。

## 10. 尚待验证与后续建议

1. 手机端完整隐私授权 → 相册/拍摄选择 → 视频上传 → 播放，尤其下面的大文件；不要声称已通过。
2. 手机端 nickname 键盘候选、PDF 原生打开、模糊定位权限与省份推荐。
3. 后台隐私指引/UGC声明/模糊定位接口开通状态核对。用户提供过声明选择截图，但不能假设所有提交已完成。
4. 若用户后续要求，再做上传大文件分片、孤立草稿/文件清理、清理失败重试和内容治理；目前没有这些实现。
5. 后续优先按用户反馈逐项修正资料，不要擅自增加社区编辑、地图导航或人工审核。

### 三个测试视频（原文件必须保留）

- `H:/SNS/xwechat_files/lz_lixiaowei_4970/temp/RWTemp/2026-10/9c0f0b195e95550ab03e3c3997b59c0b/29c258d305014264d3ed9992ea06242c.mp4`：9,042,138 字节，9.04MB / 8.62MiB。
- `H:/SNS/xwechat_files/lz_lixiaowei_4970/msg/video/2026-10/64b57e0ad76bb73608b6ecd76f2bf607_raw.mp4`：156,321,679 字节，156.32MB / 149.08MiB。
- `H:/SNS/xwechat_files/lz_lixiaowei_4970/msg/video/2026-10/20c9927daf7b80359856baa66782ead4_raw.mp4`：590,361,238 字节，590.36MB / 563.01MiB。

只读检查过文件大小；模拟器直接读H盘报file not found，本机只读HTTP副本又被域名校验挡住，**未完成成功上传测试**。临时服务已停止，临时 urlCheck 修改已恢复，原视频未删除或修改。

## 11. 下一聊天最短启动方式

读取本文件 → 看最新用户要求 → 查看相关数据/页面 → 先 git status 保护现有改动 → 做必要修改与对应测试。若只改 EN 配件数据，入口就是 knowledgeElantra.js 的 lines 和 parts.codes，不需要改5N生成脚本或部署成绩云函数。
