#!/usr/bin/env python3
"""基于现有 LUFI XF 二进制 .INI 模板生成新的 .INI 文件。

这个脚本不是从零创造 LUFI 文件，而是复制一个已知能导入的模板，
只改当前已经确认的字段，并重新计算校验和。

用法：
  python scripts/build_lufi_ini.py
"""

from __future__ import annotations

from pathlib import Path


DISPLAY_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


COMMON_UNITS = {
    "1": "kPa / 压力",
    "6": "°C / 温度",
}


def clean_input_path(value: str) -> Path:
    """清理 Windows 复制路径时常见的外层引号。"""
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
        value = value[1:-1]
    return Path(value)


def parse_hex_bytes(value: str) -> bytes:
    """把 22 01 A4 / 2201A4 / 03 22 01 A4 这类输入转成 bytes。"""
    cleaned = value.replace(" ", "").replace("-", "").replace(",", "").strip()
    if cleaned.lower().startswith("0x"):
        cleaned = cleaned[2:]
    if len(cleaned) % 2 != 0:
        raise ValueError("十六进制字节数量不完整，请检查输入")
    data = bytes.fromhex(cleaned)

    # 有些资料会把第一字节请求长度也复制进来，例如 03 22 01 A4。
    # 如果第一字节刚好等于后续字节数，这里自动去掉长度字节。
    if len(data) >= 2 and data[0] == len(data) - 1:
        data = data[1:]

    if not 1 <= len(data) <= 7:
        raise ValueError("LUFI 请求内容必须是 1 到 7 字节")
    return data


def parse_hex_int(value: str) -> int:
    """读取 7E1 / 0x7E1 这样的十六进制整数。"""
    value = value.strip()
    if value.lower().startswith("0x"):
        value = value[2:]
    return int(value, 16)


def u16le(data: bytes | bytearray, offset: int) -> int:
    return int.from_bytes(data[offset : offset + 2], "little")


def u24le(data: bytes | bytearray, offset: int) -> int:
    return int.from_bytes(data[offset : offset + 3], "little")


def u32le(data: bytes | bytearray, offset: int) -> int:
    return int.from_bytes(data[offset : offset + 4], "little")


def write_int_le(data: bytearray, offset: int, length: int, value: int) -> None:
    max_value = (1 << (length * 8)) - 1
    if not 0 <= value <= max_value:
        raise ValueError(f"数值 {value} 超出 {length} 字节可保存范围")
    data[offset : offset + length] = value.to_bytes(length, "little")


def encode_display_name(name: str) -> bytes:
    """把最多 9 位 LUFI 显示名编码成模板使用的字符表。"""
    name = name.upper()
    if len(name) > 9:
        raise ValueError("显示名最多 9 个字符")

    encoded = bytearray()
    for char in name:
        if char == " ":
            encoded.append(0x28)
        elif char in DISPLAY_CHARS:
            encoded.append(DISPLAY_CHARS.index(char))
        else:
            raise ValueError(f"显示名不支持字符：{char!r}。只能用 0-9、A-Z 和空格")

    while len(encoded) < 9:
        encoded.append(0x28)
    return bytes(encoded)


def decode_display_name(data: bytes | bytearray) -> str:
    """把模板里的 9 字节显示名解码成人能看的文本，用作默认值提示。"""
    chars: list[str] = []
    for byte in data:
        if byte == 0x28:
            chars.append(" ")
        elif 0 <= byte < len(DISPLAY_CHARS):
            chars.append(DISPLAY_CHARS[byte])
        else:
            chars.append("?")
    return "".join(chars).rstrip()


def prompt_text(label: str, default: str | None = None) -> str:
    """中文交互输入；有默认值时直接回车使用默认值。"""
    suffix = f" [{default}]" if default not in (None, "") else ""
    value = input(f"{label}{suffix}：\n> ").strip()
    if value == "" and default is not None:
        return default
    return value


def prompt_int(label: str, default: int | None = None) -> int:
    return int(prompt_text(label, "" if default is None else str(default)))


def prompt_float(label: str, default: float | None = None) -> float:
    default_text = None if default is None else f"{default:g}"
    return float(prompt_text(label, default_text))


def build_text_area(original_length: int, description: str) -> bytes:
    """生成 offset 44 之后的说明区，并保持整个文件长度不变。"""
    text = f"Explanation:\r\n{description}\r\n".encode("ascii", errors="strict")
    if len(text) > original_length:
        raise ValueError(
            f"说明文本太长：最多 {original_length} 字节，当前 {len(text)} 字节。请缩短英文说明"
        )
    return text + (b" " * (original_length - len(text)))


def recalc_checksum(data: bytearray) -> int:
    """LUFI 校验和：sum(bytes[2:44]) & 0xFFFF，写入 offset 0-1。"""
    checksum = sum(data[2:44]) & 0xFFFF
    write_int_le(data, 0, 2, checksum)
    return checksum


def print_template_summary(data: bytes) -> None:
    """显示模板当前关键字段，方便输入时参考。"""
    print("\n模板当前字段：")
    print(f"- 文件长度: {len(data)} bytes")
    print(f"- 模式字段 offset 2-3: 0x{u16le(data, 2):04X}")
    print(f"- 请求 CAN ID: 0x{u16le(data, 4):03X}")
    print(f"- LUFI 内部通信参数 offset 6-11: {' '.join(f'{b:02X}' for b in data[6:12])}")
    request_len = data[12]
    print(f"- 请求: {' '.join(f'{b:02X}' for b in data[13:13 + request_len])}")
    print(f"- 显示名: {decode_display_name(data[28:37])}")
    print(f"- 单位代码: {data[37]}")
    print(f"- data_pos: {data[40]}")
    print(f"- data_size: {data[41]}")
    print(f"- 线性公式: X * {u32le(data, 20) / 100:g} / {u24le(data, 24) / 100:g} - {data[27]}")


def main() -> int:
    print("LUFI XF INI 生成器")
    print("说明：请选择一个同类型、已验证可导入的 INI 作为模板。未知字段会从模板继承。\n")

    template_path = clean_input_path(prompt_text("请粘贴模板 INI 路径，可以带双引号"))
    template = bytearray(template_path.read_bytes())
    if len(template) < 44:
        raise ValueError("模板长度不足 44 字节，不像 LUFI INI")

    print_template_summary(template)

    default_output = str(template_path.with_name(template_path.stem + "_NEW.INI"))
    output_path = clean_input_path(prompt_text("输出 INI 路径", default_output))

    display_name = prompt_text("LUFI 显示名，最多 9 位，只能用 0-9/A-Z/空格", decode_display_name(template[28:37]))
    description = prompt_text("说明文本，建议英文且尽量短", f"{display_name} generated channel")

    request_header = parse_hex_int(prompt_text("请求 CAN ID，例如 7E1", f"{u16le(template, 4):03X}"))
    request = parse_hex_bytes(prompt_text("请求命令，例如 22 01 A4，也可以粘贴 03 22 01 A4"))

    print("\n常见单位代码：")
    for code, label in COMMON_UNITS.items():
        print(f"- {code}: {label}")
    unit_code = prompt_int("单位代码", template[37])

    data_pos = prompt_int("data_pos / 返回数据位置", template[40])
    data_size = prompt_int("data_size / 读取字节数", template[41])

    formula_a = prompt_float("公式 A，显示值 = X * A / B - C", u32le(template, 20) / 100)
    formula_b = prompt_float("公式 B，不能为 0", u24le(template, 24) / 100)
    formula_c = prompt_int("公式 C，0-255", template[27])
    if formula_b == 0:
        raise ValueError("公式 B 不能为 0")

    display_flag = prompt_int("offset 38 显示/启用字段，通常保持 1", template[38])
    formula_type = prompt_int("offset 39 公式类型，线性公式通常为 0", template[39])

    mode_default = f"{u16le(template, 2):04X}"
    mode_flags = parse_hex_int(prompt_text("offset 2-3 模式字段，没把握就保持默认", mode_default))

    # 以下字段来自 INI_FORMAT_CN.md 的已确认偏移。
    write_int_le(template, 2, 2, mode_flags)
    write_int_le(template, 4, 2, request_header)
    template[12] = len(request)
    # 保留模板原来的填充字节，只覆盖实际请求内容。
    template[13 : 13 + len(request)] = request
    write_int_le(template, 20, 4, round(formula_a * 100))
    write_int_le(template, 24, 3, round(formula_b * 100))
    write_int_le(template, 27, 1, formula_c)
    template[28:37] = encode_display_name(display_name)
    write_int_le(template, 37, 1, unit_code)
    write_int_le(template, 38, 1, display_flag)
    write_int_le(template, 39, 1, formula_type)
    write_int_le(template, 40, 1, data_pos)
    write_int_le(template, 41, 1, data_size)

    # 说明区不参与校验，但 LUFI 对总长度敏感，所以保持原文件长度。
    template[44:] = build_text_area(len(template) - 44, description)
    checksum = recalc_checksum(template)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(template)

    print("\n生成完成：")
    print(f"- 输出文件: {output_path}")
    print(f"- 文件长度: {len(template)} bytes")
    print(f"- 校验和: 0x{checksum:04X}")
    print(f"- 显示名: {display_name.upper()}")
    print(f"- 请求: {' '.join(f'{b:02X}' for b in request)}")
    print(f"- 公式: X * {formula_a:g} / {formula_b:g} - {formula_c}")
    print("\n提醒：新文件仍需要导入 LUFI 实测。不同类型参数请优先换同类型模板。")
    return 0


if __name__ == "__main__":
    try:
        exit_code = main()
    except Exception as exc:
        print()
        print(f"错误: {exc}")
        exit_code = 1

    try:
        input("\n按回车退出...")
    except EOFError:
        pass

    raise SystemExit(exit_code)
