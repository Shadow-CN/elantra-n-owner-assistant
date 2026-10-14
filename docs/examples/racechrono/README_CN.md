# RaceChrono 配置的数据来源与映射规则

## 数据存在哪里

| 文件 | 用途 |
|---|---|
| `data/avante_n_cn7_profile_614_all_pids.csv` | 原始 Infocar 参数数据 |
| `data/pids.js` | 小程序实际加载的参数数据，包含中文名、请求、位置、长度、字节序、转换公式、单位等 |
| `utils/pidData.js` | 加载并缓存 `pids.js`，按参数 ID 查询 |
| `utils/raceChronoChannels.js` | RC 官方通道的语义映射、单位换算及位置识别规则 |
| `utils/raceChronoExporter.js` | 从参数生成 RC 七项填写内容、通道完整标识、说明及 Markdown |
| `pages/racechrono/racechrono.js` | 获取本次已选参数，调用生成器并分页显示 |
| `CN7_RACECHRONO_ALL.md` | 由同一生成器生成的全量参考清单，不是小程序的读取来源 |

页面的数据路径：

```text
getApp().globalData.selectedIds
  -> pidData.getPidsByIds(ids)
  -> data/pids.js 中的参数
  -> raceChronoExporter.generate(pids)
  -> 页面内存中的 _result.entries
  -> 搜索筛选 _visible
  -> 每页 1 条写入 data.entries（由 PAGE_SIZE 控制）
```

RC 配置是在进入页面时生成的，没有另外维护一份运行时 RC 配置数据库。修改通道映射或公式生成规则后，重新进入 RC 页面即可重新生成。

搜索只作用于本次已选参数的配置。点击“导出清单”导出全部已选配置，不受搜索结果影响。导出的 `racechrono_cn7.md` 写入微信小程序的 `wx.env.USER_DATA_PATH` 目录，再通过 `wx.shareFileMessage` 分享。该目录属于微信本地沙箱，不是电脑仓库目录。

## 通道与后缀

优先同时检查参数英文名称、ECU 和源单位，选择含义一致的官方专用通道；随后考虑单位匹配的通用通道。没有可靠映射时使用模拟通道，保留数值与原单位说明，不能仅凭“Temperature”或“Pressure”字样猜测物理含义。

典型映射：

| 参数 | RC 通道 | 后缀 | 完整标识 |
|---|---|---|---|
| 左前胎温 | 轮胎温度 | `FL` | `tyre_temp_fl` |
| 右前胎压 | 轮胎压力 | `FR` | `tyre_pressure_fr` |
| 左后轮速 | 轮速 | `RL` | `wheel_speed_rl` |
| 离合器 1 温度 | 离合器温度 | `1` | `clutch_temp_1` |
| DCT 油温传感器 2 | 变速箱温度 | `2` | `gearbox_temp_2` |
| 发动机冷却液温度 | 冷却液温度 | 无 | `coolant_temp` |

位置来自明确的 Front Left / Left Front 等名称，支持 `FL/FR/RL/RR/FRONT/REAR`。同一基础通道和同一位置仍有多个参数时，使用附加数字区分，例如 `FL 1` 对应 `tyre_temp_fl_1`。不要把数字当作字节偏移或 PID。

全量表包含当前值、历史记录、阈值、传感器电压等不同含义的参数。低压告警阈值使用通用压力，而不是实际胎压通道；MAP 传感器电压使用电压，而不是歧管压力。四轮当前胎温/胎压的八条主参数和 Brake ECU 的四轮轮速优先保留不带数字的位置后缀，不受勾选顺序影响。不同选择集合中，其他重名参数的附加数字可能变化，以该次生成结果为准。

源表没有单位的疑似温度参数不自动补成 °C。位置不明的传感器不会猜成某一轮。状态/掩码保持整数代码显示，不自动把任意枚举映射为挡位或开关通道。

中文通道名称是显示译名，不同语言或版本可能略有差别；完整官方标识用于消除歧义。专用映射不代表该 PID 已实车验证。

## 数值与单位

当前 Mode 22 参数采用 `byteOffset = data_pos - 3`。原始字节序沿用项目定义：`bit_type=0` 大端、`1` 小端。有符号数使用 `bytesToInt`，无符号数使用 `bytesToUint`，小端多字节使用相应的 `Le` 函数。

压力公式输出 kPa，速度/轮速公式输出 m/s。通道支持的物理量使用明确的换算，例如 mA 转 A、W 转 kW、rad 转角度；无对应通道的单位在模拟通道中保留源数值，不假定其是其他物理量。非发动机轴转速不冒用发动机转速通道。

“源数据”是覆盖目标偏移的全零模拟输入，不是实车数据，也不是发送到 ECU 的请求。刹车压力和转向角保留已实车成功读取的示例公式，其余读取与显示仍需设备验证。

## 重新生成和验证

```text
node scripts/build_racechrono_catalog.js
node scripts/test_racechrono.js
```

全量清单由代码生成，不建议直接手改；永久修正应写入映射或生成规则，再重建清单。

## 官方依据

- [自定义 OBD-II 通道配置说明](https://racechrono.com/forum/d/1947-1947)：通道名称、单位、后缀以及测试源数据的用途。
- [通道标识规则](https://racechrono.com/support/equations/identifiers)：专用通道列表、位置与数字后缀及其组合顺序。
- [计算式参考](https://racechrono.com/support/equations)：字节提取、大小端、有符号数、位运算和浮点除法。
- [压力单位说明](https://racechrono.com/forum/d/2261-2261)：压力通道计算结果使用 kPa。
- [官方开发者的通道与单位说明](https://racechrono.com/forum/d/2001-2001?page=2)：电流 A、功率 kW、扭矩 Nm、能量 kWh 等。
