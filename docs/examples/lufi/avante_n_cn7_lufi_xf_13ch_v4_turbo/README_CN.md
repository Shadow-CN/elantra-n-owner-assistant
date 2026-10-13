# 伊兰特 N（Avante N CN7）LUFI XF 配置 V4（13 通道）

V4 保留已经实车验证的 V3 全部 12 个通道，并新增 `TURBO1.INI` 涡轮表压。

- `DCTOIL1.INI`：预览显示 `DCT control oil temperature`
- `DCTOIL2.INI`：预览显示 `DCT lubrication oil temperature`
- 其余离合器、胎压、胎温文件也已改成各自对应的英文说明。
- 普通通道仍为 129 字节，离合器通道仍为 146 字节。
- 说明区不参加配置头校验和；修改后重新验证了所有配置头校验和。
- `TURBO1.INI` 使用 LUFI 官方涡轮压力模板，长度 128 字节。

## 涡轮压力

- 请求头：`7E0`
- 响应头：`7E8`
- 请求：`22 E0 21`
- 数据位置：12
- 数据长度：2 字节无符号、大端
- 数据库原始公式：`绝对压力(hPa) = X × 0.08291`
- LUFI 显示公式：`表压(kPa) = X × 82.91 / 10000 - 100`

这里按 LUFI 官方涡轮模板的惯例，使用固定 `100 kPa` 作为大气压力基准。因此发动机未启动时应接近 0，怠速可能显示负压，增压时显示正值；在高海拔或极端天气下会存在零点偏差。

详细的二进制格式与 CSV 对应关系见 `INI_FORMAT_CN.md`。

RaceChrono 的配置方法和长 UDS 响应限制见 `RACECHRONO_TURBO_CN.md`。

