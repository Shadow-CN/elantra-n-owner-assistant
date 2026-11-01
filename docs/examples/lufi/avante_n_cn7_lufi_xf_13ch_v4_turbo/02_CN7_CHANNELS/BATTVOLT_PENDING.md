# BATTVOLT.INI (provisional)

Source parameter: 215243, Engine Control / Battery Voltage.
Request: CAN 7E0, UDS 22 E0 01; expected response CAN 7E8.
Data position: 8; size: 1 byte, unsigned.
Formula: X * 68.1 / 1000 - 0 = X * 0.0681 V.
Display name: BATTVOLT. Template: DCTOIL1.INI; length: 129 bytes.

Unit byte at offset 37 remains 6 (temperature), NOT a verified V code.
Numeric conversion is for volts, but the device may display a temperature unit.
Display precision is inherited; CSV point=1 is not mapped to an INI field.
Import, communication and on-device display have not been verified.
This provisional file is not added to the existing 13-channel CHANNELS.csv.

Regenerate with: python scripts/build_battvolt_ini.py
