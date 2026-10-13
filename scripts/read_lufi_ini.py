#!/usr/bin/env python3
"""读取并解析 LUFI XF 二进制 .INI 文件。

用法：
  python scripts/read_lufi_ini.py
  python scripts/read_lufi_ini.py path/to/file.INI
  python scripts/read_lufi_ini.py path/to/file.INI --hex-only
"""

from __future__ import annotations

import argparse
from pathlib import Path


# LUFI 显示名不是 ASCII：0x00-0x09 表示数字，0x0A-0x23 表示 A-Z。
# 0x28 在现有模板里表示空格/未使用位置。
DISPLAY_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def u16le(data: bytes, offset: int) -> int:
    """从指定偏移读取 2 字节小端整数。"""
    return int.from_bytes(data[offset : offset + 2], "little")


def u24le(data: bytes, offset: int) -> int:
    """从指定偏移读取 3 字节小端整数，LUFI 的公式 B 用 3 字节保存。"""
    return int.from_bytes(data[offset : offset + 3], "little")


def u32le(data: bytes, offset: int) -> int:
    """从指定偏移读取 4 字节小端整数。"""
    return int.from_bytes(data[offset : offset + 4], "little")


def spaced_hex(data: bytes) -> str:
    """把 bytes 转成 AA BB CC 这种方便肉眼看的十六进制。"""
    return " ".join(f"{byte:02X}" for byte in data)


def hexdump(data: bytes, width: int = 16) -> str:
    """生成类似 Format-Hex 的输出：左边偏移，中间 hex，右边 ASCII。"""
    lines: list[str] = []
    for offset in range(0, len(data), width):
        chunk = data[offset : offset + width]
        hex_part = " ".join(f"{byte:02X}" for byte in chunk)
        hex_part = hex_part.ljust(width * 3 - 1)
        ascii_part = "".join(chr(byte) if 32 <= byte <= 126 else "." for byte in chunk)
        lines.append(f"{offset:08X}  {hex_part}  {ascii_part}")
    return "\n".join(lines)


def decode_display_name(data: bytes) -> str:
    """按 LUFI 自定义字符表解码 9 字符显示名。"""
    chars: list[str] = []
    for byte in data:
        if byte == 0x28:
            chars.append(" ")
        elif 0 <= byte < len(DISPLAY_CHARS):
            chars.append(DISPLAY_CHARS[byte])
        else:
            chars.append(f"\\x{byte:02X}")
    return "".join(chars).rstrip()


def decode_text(data: bytes) -> str:
    # 第 44 字节之后是导入预览说明区，现有样例基本是 ASCII 文本。
    # latin1 不会因为未知字节报错，便于保留原始内容。
    return data.decode("latin1").rstrip("\x00")


def clean_input_path(value: str) -> Path:
    """清理 Windows 复制路径时常见的外层引号。"""
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
        value = value[1:-1]
    return Path(value)


def parse_lufi(data: bytes) -> list[tuple[str, str]]:
    if len(data) < 44:
        raise ValueError("文件长度不足 44 字节，不像 LUFI INI")

    # LUFI 头部前 44 字节是二进制配置；前两字节是 bytes[2:44] 的校验和。
    checksum_stored = u16le(data, 0)
    checksum_calc = sum(data[2:44]) & 0xFFFF

    # 偏移 12 是请求有效长度，偏移 13 起最多放 7 字节请求内容。
    request_len = data[12]
    request = data[13 : 13 + min(request_len, 7)]

    # 线性公式：显示值 = X * A / B - C。
    # A 和 B 在文件里按“实际值 * 100”保存。
    formula_a_raw = u32le(data, 20)
    formula_b_raw = u24le(data, 24)
    formula_c_raw = data[27]

    # data_pos / data_size 直接对应 Infocar CSV 的数据位置和读取长度。
    data_pos = data[40]
    data_size = data[41]

    rows = [
        ("file_length", f"{len(data)} bytes"),
        ("checksum_stored", f"0x{checksum_stored:04X}"),
        ("checksum_calc", f"0x{checksum_calc:04X}"),
        ("checksum_ok", "yes" if checksum_stored == checksum_calc else "no"),
        ("mode_flags", f"0x{u16le(data, 2):04X} ({spaced_hex(data[2:4])})"),
        ("request_can_id", f"0x{u16le(data, 4):03X}"),
        ("internal_comm", spaced_hex(data[6:12])),
        ("request_length", str(request_len)),
        ("request", spaced_hex(request)),
        ("formula_a_raw", f"{formula_a_raw} => A={formula_a_raw / 100:g}"),
        ("formula_b_raw", f"{formula_b_raw} => B={formula_b_raw / 100:g}"),
        ("formula_c", str(formula_c_raw)),
        ("display_name_raw", spaced_hex(data[28:37])),
        ("display_name", decode_display_name(data[28:37])),
        ("unit_code", f"0x{data[37]:02X}"),
        ("display_flag", f"0x{data[38]:02X}"),
        ("formula_type", f"0x{data[39]:02X}"),
        ("data_pos", f"{data_pos} (0x{data_pos:02X})"),
        ("data_size", f"{data_size} byte(s)"),
        ("reserved", spaced_hex(data[42:44])),
        ("linear_formula", f"X * {formula_a_raw / 100:g} / {formula_b_raw / 100:g} - {formula_c_raw}"),
    ]
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="读取并解析 LUFI XF 二进制 INI 文件。")
    parser.add_argument("file", nargs="?", type=Path, help="LUFI .INI 文件路径")
    parser.add_argument("--hex-only", action="store_true", help="只输出十六进制，不解析字段")
    args = parser.parse_args()

    file_path = args.file
    if file_path is None:
        raw_path = input("请拖入或粘贴 LUFI .INI 文件路径，然后按回车：\n> ")
        file_path = clean_input_path(raw_path)

        raw_hex_only = input("只看十六进制吗？输入 y 表示是，直接回车表示完整解析：\n> ")
        args.hex_only = raw_hex_only.strip().lower() in ("y", "yes")

    data = file_path.read_bytes()

    print(f"文件: {file_path}")
    print()
    print("十六进制内容:")
    print(hexdump(data))

    if args.hex_only:
        return 0

    print()
    print("LUFI 头部解析:")
    for key, value in parse_lufi(data):
        print(f"{key:18} {value}")

    if len(data) > 44:
        print()
        print("说明文本区:")
        print(decode_text(data[44:]))

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
