# RaceChrono：伊兰特 N 涡轮压力

## 推荐配置：标准 MAP PID

Infocar 数据库中的专用涡轮压力 DID 是 `22 E0 21`。RaceChrono 支持多帧 OBD-II 回复；A–H 是前八字节的快捷变量，不意味着 `raw` 最多只有八字节。是否能稳定读取此 DID，需要按实际适配器和回复验证。全量自定义配置见 `docs/examples/racechrono/CN7_RACECHRONO_ALL.md`。

RaceChrono 中建议改用标准 OBD-II MAP PID `01 0B`。它返回进气歧管绝对压力，单位为 kPa，数据就在第一个字节，适合实时记录涡轮压力。

在“设置 → 车辆配置 → OBD-II 通道 → 添加通道”中填写：

| 项目 | 值 |
|---|---|
| 通道 | 优先选择“进气歧管相对压力”或“涡轮压力”；没有时选择通用“压力” |
| 通道后缀 | 无，或未占用的数字编号 `1–63` |
| OBD-II 标头 | `0x7E0` |
| OBD-II 反馈前缀 | 留空 |
| PID | `0x010B` |
| 测试源数据 | `0xC8` |

RaceChrono 压力通道的公式输出单位为 kPa，显示单位在 App 设置中选择。不要按显示的 bar/psi 再改变公式：

- 表压 kPa：`A - 100.0`
- 绝对压力 kPa：`A`

测试数据 `0xC8` 等于十进制 200 kPa 绝对压力，因此：

- 表压为 `(200-100)/100 = 1.00 bar`
- 或 `100 kPa`
- 或约 `14.50 psi`

把该通道加入“快速通道”，因为涡轮压力变化很快。温度通道可以放慢速，但涡轮压力不适合放慢速。

## 专用涡轮 DID `22 E0 21`（待实测）

本车实车成功读取的转向角和刹车压力通道满足 `byteOffset = data_pos - 3`。依此规则，涡轮目标位置为 `raw` 偏移 9，读取两字节。源数据 `bit_type=1` 按项目数据定义为小端，应使用 `bytesToUintLe`；此涡轮通道仍需用实际回复确认端序及结果。

配置：

`Header=0x7E0, PID=0x22E021`，反馈前缀留空。

绝对压力 kPa：`bytesToUintLe(raw,9,2) * 0.08291 * 0.1`。

固定大气压基准的表压 kPa：`bytesToUintLe(raw,9,2) * 0.08291 * 0.1 - 100.0`。

至少使用 11 字节的模拟源数据，才能覆盖偏移 9 的两字节；也可开启测试连接查看完整实车回复。

官方参考：[公式](https://racechrono.com/support/equations)、[压力单位](https://racechrono.com/forum/d/2261-2261)、[长回复支持说明](https://racechrono.com/forum/d/2824-bug-report-rc-fails-intermittently-with-large-0x22-rspns-payloads-159-bytes)。

固定减去 100 kPa 是近似的大气压基准。若只关心 ECU 的绝对压力，请使用绝对压力公式；如果以后需要高海拔下精确的表压，需要同时读取实时大气压力并在后处理中相减。

