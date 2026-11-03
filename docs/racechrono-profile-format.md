# RaceChrono车辆配置RCZ

研究日期：2026-11-03。参考本地原件 `packages/knowledge/assets/knowledge/ioniq5n/vehicle_i5n.rcz`（591字节，SHA256 de1e2fc158037820015e31340451742df84461e33a31d772665a6895272e5456）。原文件未修改。

## 原件结构与官方资料

RCZ为ZIP，内含UTF-8的`vehicleProfile.json`。5N样例含11个customChannels、快慢selectedChannels、localUuid、info及OBD协议设置。RCZ也用于其他RaceChrono导出类型，所以扩展名本身不足以确定内容；本工具生成车辆配置。

- [开发者公开的通道编码与设备类型](https://racechrono.com/forum/d/2659-2659)：base ID为低15位，位置为15–19位，序号为20–25位；deviceType=5为OBD-II。
- [官方通道标识](https://racechrono.com/support/equations/identifiers)：通道、位置、编号语义。
- [官方自定义PID说明](https://racechrono.com/forum/d/1947-1947)：标头、PID、公式、快慢通道及模拟源数据的用途。

数值映射：`base + position * 32768 + index * 1048576`，位置无=0、rear=1、front=2、rr=3、rl=4、fr=5、fl=6；同类序号0–63。全部输出通道的base映射集中在utils/raceChronoProfile.js。

## 实现

1. 现有raceChronoExporter将选定PID转换为公式、单位及通道后缀，并分配配置组。
2. raceChronoProfile将标头、PID转换为JSON数字，保留公式，编码channelId；生成新的64位十六进制localUuid以区分导入配置。
3. ZIP以store方式封装，不强制压缩；文件内容仍为UTF-8 JSON。ZIP写入器与原LUFI导出共享，无新增第三方运行依赖。
4. 每组内部channelId必须唯一；需要多组时输出ZIP内多个独立RCZ，避免丢参数或覆盖通道。
5. 快通道预设为转速、车速／轮速、方向盘、油门／节气门、刹车压力、发动机扭矩，其他为慢通道。这是本工具默认策略，可在RaceChrono中调整。
6. 当前导出车型为EN，协议6（11-bit CAN / 500 kbit）；不从5N拷贝PID。ELM配对与会话／保活配置需按车辆/适配器确认。

## 验证与边界

`node scripts/test_rcz.cjs` 使用独立的Python zipfile检查ZIP目录、CRC、UTF-8 JSON、单文件及嵌套多文件。核对两条已验证参数的PID/标头/公式、70个同类参数分组、全部2680参数无丢失，并读取原始5N压缩样例。

`node scripts/test_racechrono.js` 继续覆盖七项复制、单位换算、轮位、顺序、分页及只导出已选范围。

开发者工具MCP在本轮尝试连接时不可用，未完成模拟器截图验证。实际手机RaceChrono导入、通道显示与实车读数仍需用户验证，文件结构通过不代表已实车验证。
