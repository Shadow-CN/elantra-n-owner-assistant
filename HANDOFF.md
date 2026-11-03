# 项目交接

更新时间：2026-11-04（Asia/Shanghai）。**继续工作先读本文，再读 README.md。本文是当前状态，历史文档有冲突时以本文和实际代码为准。**

## 1. 当前任务与停止位置

本轮收尾（2026-11-04）：用户要求先完成个人成绩的进步展示，然后推开发分支结束今天工作。

- 收尾补充：地区下拉改为国内拼音排序、国外最后。德国在data/tracks.js标记overseas:true，稳定ID仍是5；utils/trackCatalog.js按标记统一排序，后续新增国外地区同样标记。
- “我的成绩”新增“我的进步”：同赛道／车辆名称／干湿地分组的个人最佳、累计提升、刷新最佳时间线。实现utils/lapProgress.js，展示在pages/laps/laps.wxml/wxss，load分支在laps.js。
- 同日取最快，不虚构同日内先后；原厂／改装和轮胎随轨迹展示。下方原成绩列表、编辑删除及详情保留。
- 复用现有owner限定的mine接口，自动加载全部分页再统计；不修改云函数、不增加数据库集合。取消切换保护避免异步覆盖；空数据、旧圈速字段和跨页数据均覆盖测试。
- 更新弹窗修复一并交付：通用components/update-notice通过导航栏挂载，首次也弹；关闭后写acknowledgedChangelogVersion，不读旧版静默seenVersion。首页专属样式/方法已移到组件。
- RCZ按钮增加深浅模式底色；用户pages/tools/tools.wxml改动保留。用户将2.1.3空白示例移到changelog注释中，当前正式记录仍为2.1.2，此次保持原样，没有自动改版本号。
- 19项统一检查全部通过，主包约1.58MiB，Wiki约0.11MiB。没有额外进行手机验收，用户可自行体验。
- 本轮推送继续使用codex/rcz-obd-wiki；稳定main和v2.1.1 Release均保留在c4a004c，不合并、不更新稳定Release、不发布小程序。

后续创意状态：圈速分享卡片已有生成图示例，用户认为美术效果一般，留待讨论，未接入小程序。轮毂样式接受“平面图片透视拉伸贴图”的简化方案，未实施；原demo未被修改。赛道日账单用户不考虑。

用户最新授权：将RaceChrono的MD导出改为RCZ，先增加OBD的EN／5N页签，简化知识库维护；完成后推送到独立开发分支，保留GitHub稳定版本。

已实现：

- 开发分支 `codex/rcz-obd-wiki`。创建前fetch确认本地HEAD和origin/main均为 `c4a004c6393f255d3937d72c028567f51eb55983`。不向main推送、不合并、不发布小程序、不部署云函数。
- RC页面按钮改“导出 RCZ”，生成EN自己的vehicleProfile.json并封装为vehicle_cn7n.rcz。保留七项单独复制；仅导出勾选范围，搜索/分页不影响。超过通道序号容量时生成多个RCZ并打包ZIP，防止丢参数。实现为utils/raceChronoProfile.js，ZIP代码从LUFI抽成共享utils/zip.js。
- OBD筛选页增加与Wiki相同风格的EN／5N车型标签。EN筛选和已选参数保留，5N显示“参数数据整理中”，不使用EN数据导出。页签通过model分享参数保存；未来接5N完整数据时仍需继续实现数据加载及车型独立选项，当前只是入口。
- Wiki运行时packages/knowledge/lib/content.js从parts／blocks自动生成搜索、复制和图库。现有59词条写入固定id；图文文章只维护blocks，配件只维护parts（lines仅保留额外说明），普通文章仍用lines。已移除重复lines/images/partLineIndexes。保留可见正文、表格、配件、图片顺序、附件和所有旧链接；迎宾灯搜索复制自动使用当前“预留”编号，消除旧0101重复文字。
- build_5n_wiki.py现在只输出docs/generated/knowledge5n.import.js候选，不覆盖手工维护的knowledge5n.js。不要运行生成器整体替换正文。
- 包含上轮已完成的赛道集中配置和清理：data/tracks.js为唯一赛道维护入口，build_lap_config.cjs生成云端tracks.js与validation.js；所有20赛道/12地区ID保留。旧Wiki路由保留，清除无入口旧方法、未注册logs和空样式。
- 用户已有首页和版本提示改动保留并随开发分支一并提交。

验证：统一检查共19项，覆盖RCZ独立解包及CRC、全部2680参数、70同类通道分组、OBD车型状态、Wiki渲染及旧链接、圈速和云资源等。RCZ测试需要Python。主包约1.58MiB，知识库分包约0.11MiB。

开发者工具MCP连接当前失败，未取得新的模拟器截图；不要声称已完成真机RCZ导入。待用户用RaceChrono验证导入、通道名称/位置及实车读数，再考虑合并开发分支。云图片/附件和汇率继续按实际真机反馈处理；腾讯文档直达已确认可用。

## 2. 仓库与必须遵守的约定

- 本地项目：`D:/WeChatProjects/Elantra N OBD stats`。
- 仓库：https://github.com/Shadow-CN/elantra-n-owner-assistant ，稳定分支 `main`；当前工作分支 `codex/rcz-obd-wiki`。
- 稳定基线为 `c4a004c`，本轮整理、RCZ、OBD车型与Wiki简化在 `codex/rcz-obd-wiki`。首页及版本提示是用户先前修改，已保留；后续开发继续用当前分支，不得擅自覆盖稳定main。
- 用户明确表示其手工修改正确。保留用户最新代码、文案、命名、格式及注释，不能恢复到旧快照或运行生成器覆盖。
- 用户可能同时用VS Code保存文件。不要反复重写整个知识库数据文件；如内容变化，先重新读取并做小范围修改。
- 不删除原始视频、PDF、Excel、本地上游Wiki或上传照片。用户的测试视频在H:盘；PDF原件在Downloads。
- 不把CLI/MCP令牌、临时签名URL、Git凭据写入代码、README或交接。
- 本机VS Code：`D:/Microsoft VS Code/Code.exe`；此前已补充用户PATH与App Paths。C盘旧安装目录不完整，不要据此误判未安装。

## 3. 云环境与部署状态

- AppID：`wx113792b30d798c93`。
- 微信云开发环境：`hn-owner-asst-d7gufu33n85700993`，在 `app.js` 初始化。
- 开发者工具此前端口44890。`scripts/wechat_mcp.cjs`从环境变量`WECHAT_DEVTOOLS_CLI_TOKEN`读取令牌；令牌在聊天历史中但不要复制到文档。
- `project.private.config.json`保留本地、Git忽略。

| 云函数 | 当前状态 | 用途 |
|---|---|---|
| `lapBoard` | 已部署至V1分布局后的20赛道版本 | `lap_records`查询、提交、归属校验、修改删除、视频访问 |
| `wikiFiles` | 本轮新增批量资源接口已部署，实际调用通过 | PDF、图片和RC附件白名单访问 |
| `exchangeRates` | 本轮已新建并部署，实际调用返回全部9币种 | 每日参考汇率与服务端缓存 |

创建exchangeRates时第一次返回Creating，稍后重试部署已成功，不是尚未处理的阻塞。多函数CLI部署参数用逗号曾被当作一个名字；本轮改为分别部署成功。云端部署与小程序上传发布是独立动作，**本轮未上传发布小程序版本**。

## 4. 知识库云资源迁移（本轮重点）

### 实际完成

- 32个知识库图片/RC附件已整体上传至云存储 `knowledge/assets/media-20261103/`，目录结构与本地资源目录一致。
- 每个云对象的大小与MD5均与本地一致；SHA256及路径清单在 `docs/wiki-assets-manifest.json`，上传核对结果在 `docs/wiki-assets-upload-verification.json`。
- 本地资源仍在 `packages/knowledge/assets/knowledge/`，保留原件/维护副本，只在 `project.config.json` 的 `packOptions.ignore` 排除打包。
- PDF手册早已在云端；本轮不重复上传PDF。圈速视频本来就在云存储。
- 文字、目录、零件号依旧保留在EN/5N JS数据里，修改仍需编译/发布。
- 页面代码、样式、必要界面素材和OBD导出模板继续本地打包。

### 文件关系

| 文件 | 职责 |
|---|---|
| `packages/knowledge/data/knowledgeElantra.js` | EN正文，34词条，用户直接维护 |
| `packages/knowledge/data/knowledge5n.js` | 5N正文，25词条，手工修改需保留 |
| `cloudfunctions/wikiFiles/assets.json` | 逻辑资源路径→永久cloud fileID白名单 |
| `cloudfunctions/wikiFiles/files.json` | PDF key→永久cloud fileID白名单 |
| `cloudfunctions/wikiFiles/index.js` | 旧`{key}`返回单PDF URL；新`{keys:[...]}`批量获取资源URL，上限50，拒绝任意非白名单资源 |
| `packages/knowledge/lib/media.js` | 临时URL缓存/失效、词条图片解析、RC下载和临时文件缓存 |
| `packages/knowledge/article/article.js` | 按词条加载图片、失败重试、准备附件；保留正文/图片顺序 |
| `scripts/build_wiki_assets.cjs` | 重建assets.json和校验清单，不改写EN/5N正文 |

正文中 `/packages/knowledge/assets/…` 现在是**逻辑资源key**，并非需要打包的图片文件。不要替换为会过期的临时URL，不要删除本地维护资源。

新增资源：放到本地目录→上传同样相对结构到云端→运行`node scripts/build_wiki_assets.cjs`→更新词条引用→部署wikiFiles→编译检查。可以给脚本传新的版本云目录，例如`knowledge/assets/media-v2`。旧云目录保留给已发布版本使用。

RC分享：打开词条会预下载；下载完成按钮变成“分享 RC 配置文件”，必须由后续用户点击同步触发分享。没有下载完成时先下载，不能在异步回调里直接触发微信分享。PDF仍按点击下载后打开。

## 5. 汇率工具（已实现）

- 入口：实用工具→汇率换算。
- 9币种：人民币CNY、韩元KRW、美元USD、日元JPY、新台币TWD、港币HKD、澳元AUD、加元CAD、欧元EUR。
- 页面：`pages/exchange/exchange.{js,json,wxml,wxss}`；路由在`app.json`；入口在`pages/tools/tools.wxml`和`tools.js`。
- 币种/金额计算：`utils/exchange.js`。
- 数据获取与校验：`cloudfunctions/exchangeRates/rates.js`。
- 缓存/回退：`cloudfunctions/exchangeRates/index.js`，缓存集合`exchange_rates`，文档`latest`。
- 来源为Frankfurter v2免费每日参考汇率，固定API、无需Key；不是银行实时牌价。用户金额仅本地计算，不发给外部API。
- CNY基准交叉换算，显示来源及相关币种汇率日期；服务端6小时缓存，失败最多使用最近7天缓存，前端也可读7天以内本地缓存，并明确标注。
- 实际云端调用已返回全部9币种；模拟器实际金额验证：201250 KRW→1000.00 CNY（当时参考汇率日期2026-11-02）。这是当时验证结果，不应硬编码成固定汇率。
- 截图：`docs/exchange-cloud-preview.png`；还需用户真机体验弱网、刷新、币种切换。

## 6. 实用工具与主题

- 实用工具页用户新增的轮毂模拟器入口保留，仍为开发中占位，不是已完成的模拟器。
- 右上角白色晕影来源是`pages/tools/tools.wxss`中`.tools-body`的radial-gradient，已删除。
- `pages/tire/tire.wxss`中仍有其自己的渐变，用户本轮指的是实用工具页，没有顺带修改压力页。
- 主题沿用首页auto→dark→light，一次点击切换，没有额外主题菜单。

## 7. EN/5N知识库当前内容与导航

- EN六格：保养与规格、零件查询、轮胎与赛道、车机与功能、价格与渠道参考、手册与资料；故障与经验在下面整行。
- 5N保持原分类，目录与EN同样双列，05“手册与资料”跨两列。RaceChrono RC附件已合并至“常见问题→RaceChrono读取不到OBD数据流”。
- 首页只显示目录，选分类/搜索后才显示词条；5N不显示截断的正文节选；重复快捷按钮已删除。
- 左上角返回：搜索先清搜索，分类回当前车型目录，目录离开Wiki；详情原生返回原分类。通用导航组件不应擅自全局修改。
- EN泵`35320 2GTA0`、垫片`35320 2GTA1`；钥匙最新为新款`95440IB701`、老款`95770IB700YPN`，带VIN核对订购备注。
- 用户已把“地毯卡子”改名“脚垫卡扣”。旧ID`sparts-3v455l`在`lib/wiki.js`兼容到当前`sparts-kyq87y`，保持关联与分享有效；不要恢复旧标题。
- 脚垫卡扣图片顺序：安装示意→原参考图→卡扣特写→安装实拍。
- 迎宾灯已加独立EN词条，选取实装文字和8张图，没有把聊天截图整段公开。用户后来把codes改为“预留”，应尊重现文件，不改回0101。
- EN故障经验中有腾讯文档网页与`#小程序://`直达，失败可复制，主动取消不弹错误。直达目标表格已由用户真机确认可用。
- 数据现在单处维护：普通词条lines；配件parts（lines只写额外正文）；图文词条blocks，搜索/复制/图库由lib/content.js自动生成。图文图片顺序只改blocks；所有已有词条id已固定，改标题保留id。
- `scripts/build_5n_wiki.py`现在输出docs/generated/knowledge5n.import.js候选，人工对照合并，不再覆盖运行中的knowledge5n.js；它与云资源清单脚本不是同一个用途。

## 8. 圈速榜与赛道

- 页面：`pages/laps/`；独立成绩详情：`pages/lap-detail/`，顺序视频/链接→基础信息→改装项。
- 圈速分/秒/毫秒分栏，空毫秒000；气温、视频、链接和改装细节选填。视频使用wx.chooseMedia，无业务500MB限制。
- 改装刹车拆为brakeCalipers/brakePads，兼容旧brakes；轮毂提示19×9J ET43。
- 赛道共20个编号。新增天津V1、株洲、武汉、珠海、广东国际、山东菏泽、首钢、天津GOGOGO；V1编号11为2.4km，编号19为4.29km。
- 赛道ID统一维护在`data/tracks.js`，只能追加，不得重排/复用。`utils/laps.js`读取派生列表；云端`tracks.js`和`validation.js`由`node scripts/build_lap_config.cjs`生成。
- 地区/赛道显示按拼音排序：`data/tracks.js`中的pinyin字段，由`utils/trackCatalog.js`生成REGION_ORDER和REGION_TRACKS。展示索引与存储ID分开，定位/编辑/分享仍使用稳定ID。
- `utils/trackLocation.js`用本地省界自动推荐地区，不上传坐标，不需腾讯地图Key；拒绝可手选。分享指定赛道时不被定位覆盖。
- 普通HTTP视频链接目前复制；官方小程序shortLink尝试跳转，失败回退复制；没有抓取外站视频或通用web-view。
- 圈速榜分享菜单、好友和朋友圈回调已补，链接带track编号。

## 9. 检查结果、已知问题与继续方式

### 已完成的验证
- 最新统一检查19项全部通过：18个回归脚本+包体检查，新增RCZ独立解包、OBD车型页签、Wiki单处维护测试。覆盖Wiki、云媒体白名单/缓存、汇率、圈速、定位、上传及导出。
- `node scripts/check_package_size.js`通过：主包约1.58MiB，知识库分包约0.11MiB。含路由、资源映射、跨包引用和JSON解析检查；开发工具编译包体仍以其实际分析为准。
- 32个云对象大小/MD5核对通过。真实小程序运行环境中获取图片/RC临时链接成功，下载200；安装示意图52149字节、RC文件591字节。
- 汇率真实云调用和模拟器计算通过，截图可查。

### 必须区分的限制
- 云图片接口/下载已验证，但最终词条内全部图片渲染、长按/放大及RC微信分享仍需真机体验；未把这些说成已完整验证。
- 自动化导航曾超时；截图与automation_evaluate仍可用。用户在同时操作模拟器时，当前页面会变化，不要据错误页面截图判断加载故障。
- 本轮新建页面JSON曾被PowerShell写入UTF-8 BOM，触发微信编译错误。已移除新增运行文件BOM，全部21个相关JSON解析通过；后续保存UTF-8无BOM。包体脚本已加JSON解析防回归。
- 电脑控制node_repl此前报Windows sandbox setup错误，不能直接读取微信；迎宾灯内容实际来自用户上传的图片与聊天截图，不应声称已读取个人微信数据库。

### 后续操作顺序
1. 先让用户确认真机图片/附件/汇率体验，按反馈修正。
2. 若用户继续修改知识库，重新读取最新版，保留所有有效修改。
3. 按需运行相关测试，不反复全量测试消耗额度。
4. 用户已授权本轮推送到独立开发分支codex/rcz-obd-wiki；后续提交延续该分支，合并稳定main需按用户确认处理。
5. 微信小程序上传审核/发布需要另行处理，不能把云部署/Git推送当作已发布。

完整维护索引、资源上传步骤与测试命令在README.md；历史过程在docs/HANDOFF-history.md。
