# 车主 Wiki 阅读结构

入口：首页车主 Wiki，沿用知识库原分包。

- 目录：packages/knowledge/knowledge/knowledge，支持车型切换、分类目录、全文关键词搜索和词条摘要。
- 词条：packages/knowledge/article/article，使用 model 与 id 参数独立打开；支持单篇分享、页内目录、复制正文、参考图片图集、RC 配置分享及同分类词条。
- 伊兰特内容：packages/knowledge/data/knowledgeElantra.js，从原页面无损提取 11 类、24 篇原资料。
- IONIQ 5 N 内容：packages/knowledge/data/knowledge5n.js，沿用既有资料及图片，不改写事实。
- 通用索引：packages/knowledge/lib/wiki.js，词条 ID 根据分类 ID 与标题生成。调整同分类内顺序不改变链接；更改标题或分类 ID 会改变链接，应维护旧链接兼容。

首页不展开全部正文或图片；进入具体词条后再阅读，图片使用懒加载。不同车型的搜索、分类与联系人相互隔离。分类页面可通过 category 参数直接打开。深浅主题沿用全局一键循环设置。

本次不添加协作编辑、版本历史或云端知识库写入；资料仍在项目内维护，没有生成虚假的编辑次数或更新时间。来源说明沿用原文。

验证：node scripts/test_knowledge.js、node scripts/test_wiki.cjs、node scripts/check_package_size.js。微信模板编译通过，模拟器实际打开目录及独立词条并完成截图检查。分包约0.95MiB。预览文件：wiki-index-preview.png、wiki-article-preview.png。

## 5N 原目录与 EN 复制调整

5N 改从用户指定的 ioniq_5n_china_owner_wiki-main/docs 直接构建。运行 python scripts/build_5n_wiki.py 可按原始顺序同步充电、方向盘/仪表/车机/中控、保养/维护/改装、常见问题、有用的文件五类。当前26篇条目，保留原文文字、列表层级、19张图的上下文位置、四轮定位表格和两张OBD通道表；站内章节链接可跳转。旧版拆写条目的分享 ID 通过 aliases 映射到对应原文章节。

EN 配件新增显式 parts 数组，名称、品牌、codes 和备注分别存储。原 lines 保留用于全文搜索和整篇复制；已结构化行不在正文重复展示。复制编号时仅复制对应 code 原文，保留原零件号中的空格、斜杠和连字符；没有根据看似相似的编号自动修正或合并车型数据。一般正文和表格单元格也恢复点击复制。

两份 PDF 原文件保留：5n manual.pdf（24472627字节）、ETC.pdf（2324875字节）。用户确认后上传到云存储 knowledge/5n/manual/，由只读 wikiFiles 云函数按白名单返回临时链接，客户端提供 PDF 查看入口。两份文件均已通过真实小程序客户端下载校验，字节数与原文件一致。RC 配置仍使用原分包内附件。

验证：原知识库测试、Wiki 核心/源目录/表格/编号精确复制/旧链接兼容测试通过，微信模板编译通过。知识库分包约1.01MiB，原文件未改动。

## 2026-11-02 EN中文车主手册

用户提供的原始PDF已上传至 knowledge/en/manual/elantra-n-owner-manual-cn.pdf，wikiFiles白名单key为 en-owner-manual。EN现有“维修手册”分类下新增“车主手册（中文 PDF）”，使用既有PDF原生阅读入口，不把文件打入分包。461页/16,564,471字节，实际小程序下载及MD5与原件一致验证通过，原下载文件保留不变。
