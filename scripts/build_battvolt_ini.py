"""Build the provisional CN7 engine battery voltage channel."""

import csv
from decimal import Decimal
from pathlib import Path

from build_lufi_ini import encode_display_name, recalc_checksum, write_int_le


def main():
    root = Path(__file__).resolve().parents[1]
    folder = root / "docs/examples/lufi/avante_n_cn7_lufi_xf_13ch_v4_turbo/02_CN7_CHANNELS"
    with (root / "data/avante_n_cn7_profile_614_all_pids.csv").open(encoding="utf-8-sig", newline="") as source:
        row = next(row for row in csv.DictReader(source) if row["parameter_id"] == "215243")
    assert row["conv_rule"] == "(unsigned)X * 0.0681"
    payload = bytearray((folder / "DCTOIL1.INI").read_bytes())
    write_int_le(payload, 4, 2, int(row["request_header"], 16))
    request = bytes.fromhex(row["request_cmd"])
    payload[12] = len(request)
    payload[13:13 + len(request)] = request
    write_int_le(payload, 20, 4, 6810)
    write_int_le(payload, 24, 3, 100000)
    payload[27] = 0
    payload[28:37] = encode_display_name("BATTVOLT")
    # Unit 6 is inherited from the temperature template, NOT a verified V code.
    payload[40] = int(row["data_pos"])
    payload[41] = int(row["data_size"])
    text = b"Explanation:\r\nBattery voltage; unit unverified\r\n"
    payload[44:] = text + b" " * (len(payload) - 44 - len(text) - 2) + b"\r\n"
    checksum = recalc_checksum(payload)
    assert len(payload) == 129
    assert int.from_bytes(payload[:2], "little") == sum(payload[2:44]) & 0xFFFF
    for raw in range(256):
        assert Decimal(raw) * Decimal(6810) / Decimal(100000) == Decimal(raw) * Decimal("0.0681")
    output = folder / "BATTVOLT.INI"
    output.write_bytes(payload)
    print(f"{output}\nLength: {len(payload)}; checksum: {checksum:04X}; unit: 6 (unverified for V)")


if __name__ == "__main__":
    main()
