# 项目交接

更新：2026-11-02。本文优先于 docs/HANDOFF-history.md 的历史描述。

## 开发约定
- 仓库：https://github.com/Shadow-CN/elantra-n-owner-assistant；目录 D:/WeChatProjects/Elantra N OBD stats；当前 main。
- 用户已确认其手工修改正确，保留最新代码，尤其 pages/tools、新首页入口、胎压页和文案。轮毂模拟器目前为提示占位。
- 不删除用户原始视频、PDF、Excel、本地Wiki。测试视频在H:盘，PDF在用户Downloads，不在本轮清理范围。
- AppID wx113792b30d798c93；云环境 hn-owner-asst-d7gufu33n85700993。
- 开发工具此前端口44890；scripts/wechat_mcp.cjs从环境变量WECHAT_DEVTOOLS_CLI_TOKEN读取访问密钥，密钥不提交。脚本可重新生成已忽略的工具元数据。

## 知识库
- 首页/分类：packages/knowledge/knowledge/knowledge.*；详情：packages/knowledge/article/article.*；搜索和旧链接：packages/knowledge/lib/wiki.js。
- EN正文：packages/knowledge/data/knowledgeElantra.js，33词条；价格与渠道已进入六宫格，故障与经验在下方整行。
- 5N正文：packages/knowledge/data/knowledge5n.js，25词条；目录与EN同样双列，05“手册与资料”占整行。RaceChrono配置附件已并入“常见问题 → RaceChrono读取不到OBD数据流”，旧词条链接兼容。
- scripts/build_5n_wiki.py从ioniq_5n_china_owner_wiki-main/docs生成5N数据。运行会覆盖JS，重建前必须保留用户手工修改；本轮未运行生成器。
- 首页只显示目录，分类/搜索才显示列表；5N不显示正文节选；已移除重复快捷入口。
- 返回：搜索先清搜索，分类回当前车型目录，目录离开Wiki；详情返回原分类。
- 两车型来源URL可复制。EN故障与经验已接腾讯文档shortLink，失败可复制网页链接，主动取消不弹错误。尚待真机确认直达文档。
- 中文PDF通过cloudfunctions/wikiFiles读取；英文维修手册提供链接；原PDF保留。零件号点击复制。
- EN泵35320 2GTA0、垫片35320 2GTA1，勿反置。报价与技术资料分开；历史技术信息未重新核实。

## 圈速榜与云端
- pages/laps：榜单、地区/赛道、提交与我的成绩；pages/lap-detail：视频/链接→基础信息→改装详情。
- cloudfunctions/lapBoard处理lap_records、所有权和公开字段，wikiFiles提供PDF临时URL；此前已部署。本轮仅整理并推送Git，不重新部署或发布小程序。
- 圈速分/秒/毫秒分栏，空毫秒000；气温、视频、链接与改装细节选填。视频wx.chooseMedia，无业务500MB限制。
- 刹车卡钳/刹车皮拆分，旧brakes兼容；轮毂提示19×9J ET43。
- 自动模糊定位用本地省界匹配，拒绝可手动选地区；不需要腾讯地图Key。赛道含鄂尔多斯及纽北整圈/BTG。
- 普通HTTP视频链接复制，#小程序://尝试跳转；未实现外站视频抓取或通用网页内嵌。
- 部署/权限：docs/lap-board-setup.md；外链限制：docs/lap-video-links.md。

## 检查和清理
- scripts/test_*.js及test_*.cjs覆盖Wiki、附件/复制、返回、圈速上传校验、位置、RaceChrono导出；node scripts/check_package_size.js检查包体/路由/引用。
- 本轮仅清理明确未引用的自动darkmode样式、骨架屏、日志、Python缓存、MCP可再生元数据；多平台配置及用户新代码保留。
- project.private.config.json保留本地但停止跟踪，缓存/日志/本地工具数据加入.gitignore；HANDOFF不进入小程序包。
- 历史细节在docs/HANDOFF-history.md；EN重组前快照docs/en-wiki-before-reorg.json。旧截图仅供参考。

## 本轮检查结果
- 10个现有回归脚本及包体检查通过。EN迁移测试已按用户确认修正的钥匙/支架编号更新期望值，没有回滚正文。
- Git提交包含此前功能开发与用户最新修改；本轮清理不代表云函数或微信版本已发布。
