# Avante N (CN7 N) 自定义 OBD PID 通用转换与使用指南

> 基于 Infocar Profile 614 数据库的字段解释、字节定位、端序与符号处理，以及 Car Scanner、OBD Fusion、RaceChrono、LUFI XF 配置示例

> 当前小程序导出目标为 Car Scanner；LUFI XF 作为后续目标，需要官方 `.INI` 模板后才能生成。OBD Fusion 内容仅作为历史技术参考，不再作为项目支持方向。

**适用车型：** HYUNDAI AVANTE N / ELANTRA N (CN7 N), 2023, 2.0 T-GDI  
**数据库规模：** 2,680 个参数 / 28 个 ECU / 全部为 UDS Service 0x22  
**版本：** 1.1 - 2026-08-26

---

## 使用前先看

这份文档的目标不是让你逐行猜 PID，而是提供一套可以重复使用的转换规则：从 CSV 中选中任意参数，确定 ECU 与请求，定位原始字节，处理端序和符号，最后生成目标 App 能理解的公式。

### 核心结论

- CSV 中的 `data_pos` 按完整 UDS 正响应 `62 DID_H DID_L ...` 定位，位置 4 才是第一个有效数据字节。
- Car Scanner 和当前已实测的 OBD Fusion：有效字节字母序号 = `data_pos - 3`，A 为第 1 个有效数据字节。
- RaceChrono：对本车这类 Mode 22 请求，`byteOffset = data_pos - 3`。这是由两路 DCT 油温实车截图验证的。
- `bit_type=0` 保持响应字节顺序，即大端；`bit_type=1` 反转字节，即小端。
- `data_size_type=0` 是普通数值；`data_size_type=1` 是 bit 状态字段。

### 文档结构

| 章节 | 内容 |
|---|---|
| 1 | CSV 字段与 App 设置项的对应关系 |
| 2 | Mode 22 响应结构及通用字节定位 |
| 3 | 端序、有符号数、线性公式和位字段 |
| 4 | DCT 油温、双离合温度、胎温胎压、转向角、油门和刹车配置 |
| 5 | 诊断会话、轮询频率、验证与排错 |

> **安全提示：** 调试时由乘客操作或先记录日志，停车后再核对数据。不要在驾驶过程中盯着手机或修改通道。

---

# 1. CSV 字段怎么对应到软件设置

| CSV 字段 | 含义 | 在目标 App 中怎么用 |
|---|---|---|
| `parameter_name_en` | 参数英文名 | 通道名称；可自行改成中文 |
| `ecu_name_en` | 参数所在 ECU | 用于判断请求发给发动机、DCT、制动、EPS 等哪个控制器 |
| `request_header` | 请求 CAN ID | Header / Module Header / CAN ID |
| `response_header` | 响应 CAN ID | Response Prefix / Reply ID；没有该字段时可留空 |
| `request_cmd` | 完整 UDS 请求 | 例如 `22 01 A5`；单字段填写 `2201A5` |
| `service_mode` | 服务号 | 本表全部是 `22` |
| `pid_did` | 两字节 DID | 例如 `01 A5`；分栏界面填 Mode=22、PID=01A5 |
| `data_pos` | 数据位置 | 换算成 Car Scanner 字母或 RaceChrono `byteOffset` |
| `data_size_type` | 字节值或 bit 字段 | `0=数值`；`1=状态/枚举` |
| `data_size` | 读取长度 | 数值型时是字节数；bit 型时是位数 |
| `bit_type` | 多字节端序 | `0=大端`；`1=小端` |
| `conv_rule` | 换算或枚举规则 | 将读取出的 X 代入公式 |
| `min / max / unit / point` | 显示参数 | 仪表最小值、最大值、单位和小数位 |
| `session_open_cmd` | 诊断会话 | 直接请求失败时，先向同一 Header 发送 `10 03` 或 `10 01` |
| `tester_present_cmd` | 会话保活 | 长时间轮询时可能需要周期发送 `3E 00` |

### 一般可以忽略的字段

`data_pid` 和 `conv_opt` 主要服务于 Infocar 内部显示与解析；跨 App 转换时优先使用 `data_pos`、`data_size_type`、`data_size`、`bit_type` 和 `conv_rule`。

`supported_raw`、`request_delay_time` 等字段可在后续性能调优时参考，但不是建立通道的必要条件。

---

# 2. Mode 22 响应与字节定位

这份数据库的 2,680 个参数全部使用 UDS ReadDataByIdentifier，也就是 Service `0x22`。请求和正响应关系如下：

```text
Request : 22 DID_H DID_L
Response: 62 DID_H DID_L D1 D2 D3 D4 D5 ...
```

## data_pos 的基准

| UDS 响应位置 | 内容 | Car Scanner 有效字节 | RaceChrono raw |
|---:|---|---|---|
| 1 | `62` | 被去掉 | 被去掉 |
| 2 | DID 高字节 | 被去掉 | 被去掉 |
| 3 | DID 低字节 | 被去掉 | `raw[0] / A` |
| 4 | D1 | A | `raw[1] / B` |
| 5 | D2 | B | `raw[2] / C` |
| 10 | D7 | G | `raw[7] / H` |
| 11 | D8 | H | `raw[8]`（无 I 快捷变量） |

因此同一个 `data_pos` 在 Car Scanner 与 RaceChrono 中看起来会差一个字母。

DCT 油温 1 的 `data_pos=10`，在 Car Scanner 中是 G；但在 RaceChrono 中是 `raw[7]`，等价于 H。实车截图中的 `g=0、h=0x50` 正好验证了这个差异。

## Car Scanner / OBD Fusion 字母换算

```text
letter_number = data_pos - 3
```

```text
1=A, 2=B, ..., 26=Z, 27=AA, 28=AB, ..., 33=AG
```

## RaceChrono 字节换算

```text
byteOffset = data_pos - 3
```

示例：

```text
data_pos 36 -> bytesToInt(raw, 33, 2)
```

## ISO-TP 注意事项

不要把原始 CAN 帧里的 ISO-TP 首帧和连续帧控制字节算进 `data_pos`，例如 `10 xx`、`21`、`22`。

Car Scanner、OBD Fusion 和 RaceChrono 正常情况下会先把多帧响应重组成一条 UDS payload。

LUFI XF 则应优先使用重组模式；如果固件直接暴露原始帧，地址会额外偏移，这也是之前 LUFI 包中提供 fallback 文件的原因。

---

# 3. 数值型 PID 的通用解码

当 `data_size_type=0` 时，读取 `data_size` 个字节得到原始值 X。先按 `bit_type` 组合，再按 `conv_rule` 处理有无符号和比例。

## 3.1 端序

| `bit_type` | 名称 | 两字节 b0 b1 的无符号值 U | RaceChrono 函数 |
|---:|---|---|---|
| 0 | 大端 / Motorola | `b0 × 256 + b1` | `bytesToUint / bytesToInt` |
| 1 | 小端 / Intel | `b0 + b1 × 256` | `bytesToUintLe / bytesToIntLe` |

Infocar APK 的解析器在 `bit_type=1` 时会反转所选字节数组，因此这里的端序含义不是猜测，而是由程序实现确认。

## 3.2 有符号补码

N bytes unsigned value:

```text
U

if U >= 2^(8*N-1):
    X = U - 2^(8*N)
else:
    X = U
```

两字节有符号数的阈值是 `32768`，回绕值是 `65536`。

Car Scanner 可直接使用 `ShortSigned(A,B)`；RaceChrono 使用 `bytesToInt` 或 `bytesToIntLe`。

## 3.3 应用 conv_rule

| CSV `conv_rule` | 处理方式 |
|---|---|
| `(unsigned)X * 0.390625` | 先按无符号组合字节，再乘 `0.390625` |
| `(signed)X * 0.1` | 先按补码得到有符号 X，再乘 `0.1` |
| `(unsigned)X * 1 - 40` | 无符号 X 减 40；典型温度公式 |
| `(unsigned)X * 0.001 + 6` | 无符号 X 乘 `0.001` 后再加 6 |

### 通用 RaceChrono 模板

```text
bit_type=0, unsigned: bytesToUint(raw, data_pos-3, data_size)
bit_type=0, signed  : bytesToInt(raw, data_pos-3, data_size)
bit_type=1, unsigned: bytesToUintLe(raw, data_pos-3, data_size)
bit_type=1, signed  : bytesToIntLe(raw, data_pos-3, data_size)
```

---

# 4. 位字段与枚举状态

当 `data_size_type=1` 时，`conv_rule` 一般以 `Bit`、`Value Mask` 或 `Bit Mask` 开头。此类数据适合显示为 0/1 指示灯、挡位状态或枚举文本，而不是连续指针仪表。

## 4.1 单 bit

CSV：

```text
(Bit2 = 0x04) 0 = OFF / 1 = ON
```

Generic：

```text
(byte >> 2) & 1
```

Car Scanner：

```text
GetBit(F,2)
```

RaceChrono：

```text
(bytesToUint(raw,6,1) >> 2) & 1
```

## 4.2 连续多个 bit

CSV：

```text
(Bit2,3 = 0x0C) ...
```

Generic：

```text
(byte >> 2) & 3
```

通用掩码：

```text
Mask = (1 << bit_count) - 1
```

## 4.3 Value Mask

读取整个字节，将数值与 `conv_rule` 中的 `0xXX` 映射表比较。

若 App 不支持返回文字，可以先保留数值码，在仪表名称或备注中写明 `0/1/2/3` 的含义。

## 4.4 Bit Mask

Bit Mask 允许同一字节中多个标志同时为 1，不适合合成一个枚举值。

更好的做法是为每个感兴趣的 bit 单独建立一个通道。

### 适合自动转换的范围

| 类别 | 数量 | 建议 |
|---|---:|---|
| 普通数值公式 | 971 | 可自动生成绝大多数 App 公式 |
| Bit 状态字段 | 1,695 | 根据 `conv_rule` 生成 `GetBit` 或移位掩码 |
| Value Mask | 11 | 保留数值或手动建立枚举 |
| Bit Mask | 3 | 拆成多个布尔通道 |

---

# 5. 实用参数配置

## 5.1 DCT 控制油温与润滑油温

| 项目 | 控制油温 1 | 润滑油温 2 |
|---|---|---|
| ECU | Dual Clutch Transmission | Dual Clutch Transmission |
| Header / Response | `7E1 / 7E9` | `7E1 / 7E9` |
| Request | `22 01 A5` | `22 01 A5` |
| data_pos / size | `10 / 1` | `11 / 1` |
| conv_rule | `X - 40` | `X - 40` |
| Car Scanner / OBD Fusion | `G - 40` | `H - 40` |
| RaceChrono | `bytesToUint(raw,7,1) - 40` | `bytesToUint(raw,8,1) - 40` |
| LUFI 数据地址 | `10` | `11` |
| Session | `10 03` | `10 03` |

### 实车响应示例

```text
62 01 A5 FF FF FF 00 01 00 50 56 0A ...
```

Oil temp 1 byte:

```text
0x50 = 80 -> 40 °C
```

Oil temp 2 byte:

```text
0x56 = 86 -> 46 °C
```

RaceChrono 截图中 `g=0`，所以 `g-40=-40 °C`；`h=0x50=80`，所以 `h-40=40 °C`。

这正是第一路负数、第二路读取成第一路油温的原因。

---

## 5.2 双离合器片温度

两个离合器温度与油门、挡位等数据共用 DCT 的 `22 01 A4` 响应。

数据库将它们定义为两字节大端有符号整数，换算比例为 1，因此原始有符号值就是摄氏温度。

| 项目 | 离合器 1 | 离合器 2 |
|---|---|---|
| 含义 | 奇数挡轴离合器 | 偶数挡轴离合器 |
| 参数 ID | `193946` | `193947` |
| Header / Response | `7E1 / 7E9` | `7E1 / 7E9` |
| Request | `22 01 A4` | `22 01 A4` |
| data_pos / size | `37 / 2` | `39 / 2` |
| 类型 / 端序 | signed / 大端 | signed / 大端 |
| conv_rule | `X × 1` | `X × 1` |
| Car Scanner | `ShortSigned(AH,AI)` | `ShortSigned(AJ,AK)` |
| RaceChrono | `bytesToInt(raw,34,2)` | `bytesToInt(raw,36,2)` |
| LUFI 数据地址 | `37，长度 2` | `39，长度 2` |
| Session | `10 03` | `10 03` |

### OBD Fusion 两字节有符号组合

若不能直接使用两字节有符号函数，可按大端补码组合：

```text
Clutch 1: (signed(AH) * 256 + AI)
Clutch 2: (signed(AJ) * 256 + AK)
```

这里必须使用有符号读取。

若错误地按无符号数读取，负值或无效占位值可能显示成非常大的正数。

数据库声明范围为 `-51 到 715 °C`；实际使用时应结合冷车环境温度、两路相互关系和升温趋势判断数据是否有效。

### 静态验证

冷车唤醒 ECU 后，两路温度通常应处于合理环境范围且彼此接近；低速起步、蠕行或连续换挡后应缓慢变化。

请不要为了验证温度而长时间半联动或反复制动蠕行。

---

## 5.3 方向盘绝对转向角

| 字段 | 值 |
|---|---|
| Parameter | Absolute Steering Angle (ID `185035 / 185021`) |
| ECU | Power Steering |
| Header / Response | `7D4 / 7DC` |
| Request | `22 01 01` |
| data_pos / size / bit_type | `11 / 2 / 0`（大端） |
| conv_rule | `(signed)X * 0.1` |
| Unit | degree |
| Session | `10 03` |

Car Scanner：

```text
ShortSigned(H,I) * 0.1
```

OBD Fusion：

```text
(signed(H) * 256 + I) * 0.1
```

RaceChrono：

```text
bytesToInt(raw,8,2) * 0.1
```

方向符号可能与某个 App 的左右定义相反。

方向盘回正应接近 0；向左右各转动约 90 度做验证。如果方向完全相反，在最终结果前乘 `-1`。

---

## 5.4 油门踏板百分比

| 字段 | 值 |
|---|---|
| Parameter | Accelerator Pedal Position Sensor (ID `193929`) |
| ECU | Dual Clutch Transmission |
| Header / Response | `7E1 / 7E9` |
| Request | `22 01 A4` |
| data_pos / size / bit_type | `13 / 1 / 0` |
| conv_rule | `(unsigned)X * 0.390625` |
| Unit | `%` |
| Session | `10 03` |

Car Scanner / OBD Fusion：

```text
J * 0.390625
```

RaceChrono：

```text
bytesToUint(raw,10,1) * 0.390625
```

---

## 5.5 刹车液压压力

| 字段 | 值 |
|---|---|
| Parameter | Pressure Sensor (ID `179854`) |
| ECU | Brake |
| Header / Response | `7D1 / 7D9` |
| Request | `22 01 04` |
| data_pos / size / bit_type | `36 / 2 / 0`（大端） |
| conv_rule | `(signed)X * 0.0153` |
| Unit | bar |
| Session | `10 01` |

Car Scanner：

```text
ShortSigned(AG,AH) * 0.0153
```

OBD Fusion：

```text
(signed(AG) * 256 + AH) * 0.0153
```

RaceChrono：

```text
bytesToInt(raw,33,2) * 0.0153
```

未踩刹车时应接近 `0 bar`，踩踏越深压力越高。

CSV 还包含：

- Primary Pressure Sensor：`data_pos=38`
- Secondary Pressure Sensor：`data_pos=40`

建议先验证 Pressure Sensor 与踏板动作的相关性，再决定是否增加另外两路。

---

## 5.6 刹车踏板开关

| 字段 | 值 |
|---|---|
| Parameter | Brake Lamp Switch (ID `215285`) |
| ECU | Engine Control |
| Header / Response | `7E0 / 7E8` |
| Request | `22 E0 04` |
| data_pos | `9` |
| conv_rule | `Bit2: 0=OFF, 1=ON` |
| Session | `10 03` |

Car Scanner：

```text
GetBit(F,2)
```

RaceChrono：

```text
(bytesToUint(raw,6,1) >> 2) & 1
```

刹车开关适合做制动起点标记；液压压力更适合分析制动力度、拖刹和松刹过程。

---

## 5.7 四轮胎压与胎温

四个车轮的数据全部来自 IBU-TPMS 的同一个 `22 C0 0B` 响应。

- 胎压原始字节 × `1.373` 得到 kPa
- 胎温原始字节 - `50` 得到 °C

### 公共设置

| 项目 | 值 |
|---|---|
| ECU | Tire Pressure Monitoring (IBU-TPMS) |
| Header / Response | `7A0 / 7A8` |
| Request | `22 C0 0B` |
| Session | `10 03` |
| 数据类型 | 单字节无符号 |

### 四轮数据位置

| 车轮 | 胎压 data_pos / 字母 / Race offset | 胎温 data_pos / 字母 / Race offset |
|---|---|---|
| 左前 FL | `8 / E / 5` | `9 / F / 6` |
| 右前 FR | `13 / J / 10` | `14 / K / 11` |
| 左后 RL | `18 / O / 15` | `19 / P / 16` |
| 右后 RR | `23 / T / 20` | `24 / U / 21` |

### Car Scanner / OBD Fusion 公式

```text
FL:
pressure = E * 1.373 kPa
temperature = F - 50 C

FR:
pressure = J * 1.373 kPa
temperature = K - 50 C

RL:
pressure = O * 1.373 kPa
temperature = P - 50 C

RR:
pressure = T * 1.373 kPa
temperature = U - 50 C
```

### RaceChrono 公式

```text
FL:
bytesToUint(raw, 5, 1) * 1.373
bytesToUint(raw, 6, 1) - 50

FR:
bytesToUint(raw, 10, 1) * 1.373
bytesToUint(raw, 11, 1) - 50

RL:
bytesToUint(raw, 15, 1) * 1.373
bytesToUint(raw, 16, 1) - 50

RR:
bytesToUint(raw, 20, 1) * 1.373
bytesToUint(raw, 21, 1) - 50
```

### 显示单位

| 显示单位 | 公式 |
|---|---|
| kPa | `X × 1.373` |
| bar | `X × 0.01373` |
| psi | `X × 0.1991368` |
| 胎温 °C | `X - 50` |

例如需要在 RaceChrono 中显示 bar，只需把胎压公式末尾的 `× 1.373` 改成 `× 0.01373`。

建议显示 1-2 位小数；kPa 可显示 0-1 位。

> **TPMS 注意：** TPMS 传感器通常不是持续高速广播。车辆长时间静止时，App 可能显示上次保存值、未初始化值或不更新；短距离行驶并让四个传感器唤醒后再判断 PID 是否正确。轮胎刚停下时读到的是轮内传感器附近温度，不等同于胎面橡胶表面温度。

### 验证顺序

1. 先与车辆原厂胎压页面或可靠胎压表对照四轮位置和数值。
2. 冷车四轮温度通常应比较接近环境温度；日晒侧和制动后可能明显更高。
3. 若某一轮长期为固定异常值，先确认该传感器已唤醒，并检查车轮位置是否在换胎后重新学习。
4. 同一个 `22 C0 0B` 响应包含全部八个值；若 App 支持共享请求，避免为八个通道重复发送八次。

---

# 6. 各 App 的填写方法

## 6.1 Car Scanner

| 界面字段 | 填写规则 |
|---|---|
| Command / Mode + PID | `request_cmd` 去掉空格，例如 `2201A5`；分栏时 Mode=`22`、PID=`01A5` |
| Header | `request_header`，例如 `7E1` |
| Equation | 按 `data_pos` 换算字母后套入 `conv_rule` |
| Minimum / Maximum / Unit | 直接使用 CSV 的 `min`、`max`、`unit`；空值可按用途自定 |
| Start diagnostic commands | 只有直读失败时才加入诊断会话命令 |

Car Scanner 会自动跳过响应 Header、长度、正响应服务号和 PID/DID，然后把第一个有效数据字节记为 A。

公式区分大小写，并支持 `A...Z`、`AA`、`AB...`、`GetBit` 和 `ShortSigned`。

---

## 6.2 OBD Fusion

填写：

- Module Header
- OBD Mode
- PID Number
- Equation

对本车已实测的 Mode 22 数据，字母定位可与 Car Scanner 相同。

普通无符号线性公式可直接使用；两字节有符号大端可写成：

```text
signed(高字节) × 256 + 低字节
```

再乘比例。

不同版本的公式解析器可能略有差异，先在静止状态验证零点和正负值。

---

## 6.3 RaceChrono

| 界面字段 | 填写规则 |
|---|---|
| PID | 完整请求，例如 `0x2201A5` |
| OBD-II Header | `request_header`，例如 `0x7E1` |
| Response Prefix | 可填写 `response_header`；物理寻址稳定时也可留空 |
| Equation | 优先使用 `bytesToUint/Int/UintLe/IntLe`，不依赖字母上限 |
| PID Postfix | 只用于区分相同请求下的多个通道，不决定数据位置 |

---

## 6.4 LUFI XF

在推荐的 ISO-TP 重组模式下，Data Address 直接使用 CSV 的 `data_pos`。

Service 22 请求要加 ISO-TP 单帧长度前缀，例如：

```text
22 01 A5
```

在 CAN DATA 中写成：

```text
03 22 01 A5
```

多字节数据同时设置长度、`SIGNED/UNSIGNED` 和端序。

若固件暴露的是原始 ISO-TP 帧，则使用之前 LUFI 包中的 fallback 地址。

---

# 7. 诊断会话与通信稳定性

## 先直接请求，再处理会话

很多 ECU 在点火后已经处于可读取状态。

先只配置 Header、PID 和公式；能够返回稳定数据时，不需要额外发送 `session_open_cmd`。

只有无响应或返回 `7F` 否定响应时，再加入诊断会话。

### EPS 示例

```text
ATSH7D4
1003
220101
```

### 会话命令

| 命令 | 作用 | 建议 |
|---|---|---|
| `10 01` | 默认诊断会话 | 通常无需重复发送 |
| `10 03` | 扩展诊断会话 | 部分发动机、DCT、EPS 数据可能需要 |
| `3E 00` | Tester Present | 长时间保持扩展会话时周期发送 |
| `20` | 会话关闭/退出 | 不要在每次轮询后发送 |

## 轮询频率建议

| 数据 | 建议刷新率 | 原因 |
|---|---:|---|
| 方向盘角度 | 10-20 Hz | 用于赛道轨迹与操控分析 |
| 油门踏板 | 10-20 Hz | 需要捕捉开闭油过程 |
| 刹车压力/开关 | 10-20 Hz | 需要捕捉制动起点、峰值和松刹 |
| DCT 油温 | 1-2 Hz | 温度变化慢，无需高频 |
| 离合器温度 | 1-2 Hz | 温度趋势为主，与 `22 01 A4` 其他通道共享响应 |
| 胎温/胎压 | 0.2-1 Hz | 传感器广播较慢，高频查询通常没有额外价值 |

同一个 `request_header + request_cmd` 通常返回一整块数据，多个参数可以共享同一次响应。

若 App 不会自动合并相同请求，重复建立大量同 PID 通道会降低刷新率。

跨 Engine、DCT、Brake、EPS 四个 ECU 高频轮询时，应使用性能较好的 OBD 适配器，并逐步增加通道。

---

# 8. 验证与排错清单

| 现象 | 最可能原因 | 检查方法 |
|---|---|---|
| 固定为 `-40 °C` | 取到前一个 `00` 字节 | data_pos/公式整体向后移动一个字节；RaceChrono 优先用 `byteOffset` |
| 数值大得离谱 | 端序反了 | 在 `bit_type=0/1` 对应的大端、小端函数之间切换 |
| 正方向正常、负方向异常 | 没有按有符号补码解析 | 使用 `bytesToInt`、`ShortSigned` 或 `signed(高字节)` |
| 一直为 0/1 但应连续变化 | 选成了开关状态而非模拟量 | 刹车用 Pressure Sensor；油门用 Accelerator Pedal Position |
| 完全无响应 | Header、DID 或诊断会话不对 | 核对 `request_header/request_cmd`；必要时发送 `session_open_cmd` |
| 几秒后停止更新 | 扩展会话超时 | 周期发送 `3E 00`，或降低轮询负荷 |
| 更新很慢 | 重复请求或 ECU 太多 | 合并 Header+Request；降低温度刷新率；减少无用 PID |
| 转向角左右颠倒 | 符号方向定义不同 | 确认回正为 0 后，最终公式乘 `-1` |

## 推荐的静态测试顺序

1. 点火 ON、车辆静止，先观察所有通道是否有稳定初值。
2. 方向盘回正、左右各转约 90 度，确认零点、比例和正负方向。
3. 缓慢踩下油门，确认 0% 附近到较高百分比连续变化。
4. 发动机怠速、车辆可靠固定时轻踩刹车，确认开关跳变且压力同步上升。
5. 冷车时两路 DCT 油温应接近环境温度，行驶后逐步上升。
6. 冷车时两路离合器温度应在合理范围并相互接近；行驶后观察趋势，不要用长时间半联动做压力测试。
7. 短距离行驶唤醒 TPMS 后，与原厂胎压页面核对四轮位置、胎压和胎温。
8. 确认后再进行低速道路测试，并记录日志与 Infocar/其他已知正确 App 交叉比较。

---

# 附录 A - 一页式通用转换流程

| 步骤 | 操作 |
|---:|---|
| 1 | 按 `parameter_name_en` 搜索目标，确认 `ecu_name_en` |
| 2 | 复制 `request_header`、`response_header`、`request_cmd` |
| 3 | 确认 `data_size_type`：`0=数值`；`1=bit 状态` |
| 4 | 数值型读取 `data_size` 个字节；bit 型按 `conv_rule` 取位 |
| 5 | `bit_type=0` 用大端；`bit_type=1` 用小端 |
| 6 | `conv_rule` 为 signed 时使用补码有符号读取 |
| 7 | Car Scanner 字母序号=`data_pos-3`；RaceChrono offset=`data_pos-3` |
| 8 | 将原始 X 代入 `conv_rule`，填写 `unit/min/max/point` |
| 9 | 先直接请求；失败时再按 `session_open_cmd` 打开会话 |
| 10 | 停车静态验证，再与 Infocar 或已知正确数据交叉核对 |

## 快速公式

```text
Car Scanner data letter number = data_pos - 3

RaceChrono byteOffset = data_pos - 3

Big-endian unsigned U = sum(b[i] * pow(256, N-1-i))

Little-endian unsigned U = sum(b[i] * pow(256, i))

Signed X = U >= pow(2,8*N-1) ? U-pow(2,8*N) : U
```

## 优先选择

优先转换：

```text
calc_type=1
data_size_type=0
conv_rule 以 (unsigned) 或 (signed) 开头
```

这些参数最适合仪表、曲线和赛道日志。

对于 `Bit/Value Mask/Bit Mask` 参数，先明确想显示的是单个标志还是枚举状态。

---

# 附录 B - 数据来源与参考

本指南的数据字段与示例取自 Infocar AVANTE N (CN7 N) Profile 614 数据库导出的 CSV：

```text
avante_n_cn7_profile_614_all_pids.csv
```

数据库规模：

```text
Rows: 2,680
ECUs: 28
Service: 0x22
```

## 软件公式参考

- RaceChrono Equations reference: https://racechrono.com/support/equations
- Car Scanner Custom PIDs: https://www.carscanner.info/ru/custompids/

## 适用范围

本指南针对该数据库和这台 Avante N / Elantra N CN7 的实测响应建立。

相同名称的 PID 在其他现代/起亚车型、不同 ECU 软件版本或不同年份上可能使用不同 DID、位置或比例，不能只凭名称跨车型照搬。

## 已验证与待验证

| 项目 | 状态 |
|---|---|
| 两路 DCT 油温 PID、Header、公式 | 已通过 Infocar 与多款 App 实车对照 |
| RaceChrono 油温 byteOffset | 已通过用户实时响应截图验证 |
| 两路离合器温度 | 来自同一车型 DCT 数据库，公式已转换，待实车交叉验证 |
| 四轮胎压与胎温 | 来自同一车型 IBU-TPMS 数据库，公式已转换，待唤醒传感器后验证 |
| `bit_type` 端序含义 | 已从 Infocar APK 解析代码确认 |
| 方向盘角、油门、刹车压力示例 | 来自同一车型数据库，仍建议按本文静态流程实车验证 |
| 全部 2,680 个参数 | 未逐个进行实车可用性验证 |

## 结论

CSV 已经包含建立自定义 PID 所需的核心信息。

只要固定使用：

```text
Header + Request + data_pos + data_size + bit_type + conv_rule
```

这条链路，就可以把绝大多数数值参数转换到不同 App。

遇到差异时，通过实时原始响应验证 `byteOffset`，而不是盲目调整公式。
