# Elantra N Owner Assistant

伊兰特 N / Avante N CN7N 车主助手微信小程序。

这个项目把 Elantra N 车主常用的维护资料、零件信息和 OBD PID 配置工具整理到一个本地小程序里，方便在手机上快速查询，也可以选择 PID 并导出 Car Scanner 可用的 `.csp` 配置文件。LUFI XF `.INI` 支持已加入转换规范，待补充官方模板后开放生成。

## 功能

- 维护知识库：零件号、耗材、胎压、扭矩、服务信息等常用资料速查。
- OBD 参数筛选：按 ECU 和参数类型筛选内置 PID。
- 参数选择清单：批量勾选、全选、移除和清空已选参数。
- Car Scanner 导出：把已选 PID 生成 `custompids.csp` 并调用微信文件分享。
- LUFI XF 支持准备中：按 `Infocar_CSV_to_LUFI_INI_AI_Guide_CN.md` 规范，需基于官方 `.INI` 模板生成。
- 深色模式：支持 `auto / dark / light` 手动切换。
- 小程序分享：支持分享到聊天和朋友圈。

## 技术栈

- 原生微信小程序
- JavaScript / WXML / WXSS
- 本地数据文件：`data/pids.js`
- 数据转换脚本：Python + openpyxl

项目不依赖云开发、登录系统或外部后端。

## 页面

| 页面 | 路径 | 说明 |
|---|---|---|
| 首页 | `pages/index/index` | 工具入口 |
| 维护知识库 | `pages/knowledge/knowledge` | 维护资料与补充信息 |
| OBD 筛选 | `pages/filter/filter` | 按 ECU / 类型筛选 |
| 参数列表 | `pages/params/params` | 勾选 PID |
| 导出配置 | `pages/export/export` | 生成并分享 `.csp`，展示 LUFI 支持状态 |

## 如何打开

1. 安装并打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 选择“导入项目”，目录选择本仓库根目录。
3. AppID 使用 `project.config.json` 中的配置，或按需要改成自己的测试 AppID。
4. 使用微信开发者工具编译、预览或真机调试。

注意：项目当前使用 WebView 渲染路径，请保持 `project.private.config.json` 中 `skylineRenderEnable` 为 `false`。开启 Skyline 可能导致部分列表、点击和主题样式行为异常。

## 数据更新

源数据主要位于：

- `data/avante_n_cn7_profile_614_all_pids.csv`
- `data/avante_n_cn7_profile_614_all_pids_cn.xlsx`
- `readme/avante_n_cn7_custom_pid_conversion_guide_zh.md`

更新 CSV / Excel 后，可运行转换脚本重新生成小程序使用的数据：

```powershell
python scripts/convert_csv.py
```

生成结果是：

```text
data/pids.js
```

微信小程序侧直接 `require('../../data/pids')` 读取数据。不要改回 `.json`，小程序环境里直接 `require('.json')` 曾出现兼容问题。

## 目录结构

```text
app.js / app.json / app.wxss       小程序入口与全局样式
components/navigation-bar/         自定义导航栏
pages/index/                       首页
pages/knowledge/                   维护知识库
pages/filter/                      OBD 参数筛选
pages/params/                      参数选择列表
pages/export/                      Car Scanner 配置导出 / LUFI 支持状态
utils/                             主题、PID 数据、公式解析、导出和分享工具
data/                              源数据与生成后的 PID 数据
scripts/                           数据转换脚本
sample/                            Car Scanner 示例文件
readme/                            规则说明与参考文档
```

## 导出说明

导出页会把已选 PID 转换成 Car Scanner 的 `.csp` 文件格式，并通过 `wx.shareFileMessage` 调起微信分享。

LUFI XF 的 `.INI` 不是普通文本 INI，而是基于官方模板改写的二进制文件。项目中的 `Infocar_CSV_to_LUFI_INI_AI_Guide_CN.md` 记录了转换规范；在没有官方可导入模板文件前，不从零生成 LUFI `.INI`。

`wx.shareFileMessage` 必须在用户点击事件的同步调用栈中触发，所以导出逻辑使用同步写文件再分享。开发者工具中可能出现分享界面不可用或 `shareSkipped`，真机表现以微信实际环境为准。

## 备注

这个项目主要服务 Elantra N / Avante N CN7 车主个人使用场景。数据、零件号和维护信息请以车辆实际版本、当地经销商和官方维修资料为准。
