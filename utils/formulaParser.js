/**
 * formulaParser.js
 *
 * Parses conv_rule strings from pids.json and generates
 * Car Scanner equation strings (FR field).
 *
 * conv_rule formats (data_size_type=0, numeric):
 *   (unsigned)X * MUL
 *   (unsigned)X * MUL + OFS
 *   (unsigned)X * MUL - OFS
 *   (signed)X * MUL
 *   (signed)X * MUL + OFS
 *   (signed)X * MUL - OFS
 *   (unsigned)X * 1       → simplified: X (no multiplier text)
 *
 * conv_rule formats (data_size_type=1, bit field):
 *   (Bit2 = 0x04) 0 = OFF / 1 = ON          → single bit
 *   (Bit2,3 = 0x0C) ...                      → multi-bit range
 *   (Value Mask) 0x00 = Stop / 0x01 = Stall  → value mask
 *   (Bit Mask) ...                            → bit mask
 *
 * Car Scanner letter mapping:
 *   letter_number = data_pos - 3
 *   1=A, 2=B, ..., 26=Z, 27=AA, 28=AB, ...
 *
 * Car Scanner supported functions:
 *   Single byte unsigned:   A, B, ... (letter alone)
 *   Multi-byte unsigned BE: A*256+B, A*65536+B*256+C, ...
 *   Multi-byte signed BE:   ShortSigned(A,B) for 2 bytes
 *   Multi-byte signed >2B:  ShortSigned does not extend; use manual formula
 *   Bit field:              GetBit(A, N)
 */

/**
 * Convert letter_number (1-based) to Car Scanner letter string.
 * 1=A, 2=B, ..., 26=Z, 27=AA, 28=AB, ..., 52=AZ, 53=BA, ...
 */
function letterNum(n) {
  if (n <= 0) return '?'

  var letters = ''
  // Convert to base-26 style (but A=1 not 0)
  var remaining = n
  while (remaining > 0) {
    remaining -= 1               // shift so A=0 for modulo
    letters = String.fromCharCode(65 + (remaining % 26)) + letters
    remaining = Math.floor(remaining / 26)
  }
  return letters
}

/**
 * Return array of Car Scanner letter strings for data_pos and data_size bytes.
 * e.g. data_pos=10, data_size=2 → ['G', 'H']
 */
function getLetters(dataPos, dataSize) {
  var letters = []
  for (var i = 0; i < dataSize; i++) {
    letters.push(letterNum(dataPos - 3 + i))
  }
  return letters
}

/**
 * Parse a numeric conv_rule string.
 * Returns { signed, mul, ofs } or null if unparseable.
 *
 * Examples:
 *   "(unsigned)X * 0.0681"     → { signed: false, mul: 0.0681, ofs: 0 }
 *   "(signed)X * 0.1"          → { signed: true,  mul: 0.1,    ofs: 0 }
 *   "(unsigned)X * 1 - 40"     → { signed: false, mul: 1,      ofs: -40 }
 *   "(unsigned)X * 0.001 + 6"  → { signed: false, mul: 0.001,  ofs: 6 }
 */
function parseNumericRule(convRule) {
  if (!convRule) return null

  var rule = convRule.trim()

  // Match: (unsigned|signed)X * MUL [+|- OFS]
  var m = rule.match(
    /^\((unsigned|signed)\)X\s*\*\s*([0-9.eE+\-]+)(?:\s*([+\-])\s*([0-9.eE+\-]+))?/i
  )
  if (!m) return null

  var signed = m[1].toLowerCase() === 'signed'
  var mul = parseFloat(m[2])
  var ofs = 0
  if (m[3] !== undefined && m[4] !== undefined) {
    ofs = parseFloat(m[4])
    if (m[3] === '-') ofs = -ofs
  }

  if (isNaN(mul)) return null

  return { signed: signed, mul: mul, ofs: ofs }
}

/**
 * Parse a bit field conv_rule.
 * Returns { type, bitStart, bitCount, bitMask } or null.
 *
 * type: 'single_bit' | 'multi_bit' | 'value_mask' | 'bit_mask'
 */
function parseBitRule(convRule) {
  if (!convRule) return null

  var rule = convRule.trim()

  // Single bit: (Bit2 = 0x04) ...
  var single = rule.match(/^\(Bit(\d+)\s*=\s*0x[0-9A-Fa-f]+\)/)
  if (single) {
    var bitNum = parseInt(single[1], 10)
    return { type: 'single_bit', bitStart: bitNum, bitCount: 1 }
  }

  // Multi-bit range: (Bit2,3 = 0x0C) ...
  var multi = rule.match(/^\(Bit(\d+),(\d+)\s*=\s*0x[0-9A-Fa-f]+\)/)
  if (multi) {
    var start = parseInt(multi[1], 10)
    var end = parseInt(multi[2], 10)
    var count = Math.abs(end - start) + 1
    return { type: 'multi_bit', bitStart: Math.min(start, end), bitCount: count }
  }

  if (/^\(Value Mask\)/i.test(rule)) {
    return { type: 'value_mask' }
  }

  if (/^\(Bit Mask\)/i.test(rule)) {
    return { type: 'bit_mask' }
  }

  return null
}

/**
 * Format a number for use in a formula string.
 * Avoids unnecessary trailing zeros (e.g. 1.0 → "1", 0.390625 → "0.390625").
 */
function fmtNum(n) {
  if (Number.isInteger(n)) return String(n)
  // Use up to 10 significant digits, trim trailing zeros
  var s = n.toPrecision(10).replace(/\.?0+$/, '')
  return s
}

/**
 * Build a Car Scanner equation string (FR field) for a numeric PID.
 *
 * Handles:
 * - 1-byte unsigned/signed
 * - 2-byte unsigned/signed (big-endian or little-endian)
 * - 3-4 byte unsigned (rare but present)
 *
 * Returns the FR string, or null if generation fails.
 */
function buildNumericFR(pid) {
  var parsed = parseNumericRule(pid.cr)
  if (!parsed) return null

  var letters = getLetters(pid.dp, pid.ds)
  if (letters.length === 0) return null

  var signed = parsed.signed
  var mul = parsed.mul
  var ofs = parsed.ofs
  var isBigEndian = pid.bt === 0

  var rawExpr = ''

  if (pid.ds === 1) {
    // Single byte
    if (signed) {
      rawExpr = 'signed(' + letters[0] + ')'
    } else {
      rawExpr = letters[0]
    }
  } else if (pid.ds === 2) {
    // Two bytes
    if (isBigEndian) {
      if (signed) {
        rawExpr = 'ShortSigned(' + letters[0] + ',' + letters[1] + ')'
      } else {
        rawExpr = letters[0] + '*256+' + letters[1]
      }
    } else {
      // Little-endian: low byte first
      if (signed) {
        // Car Scanner: signed((B*256+A)) — note byte order reversed
        rawExpr = 'signed(' + letters[1] + '*256+' + letters[0] + ')'
      } else {
        rawExpr = letters[1] + '*256+' + letters[0]
      }
    }
  } else if (pid.ds === 3) {
    if (isBigEndian) {
      rawExpr = letters[0] + '*65536+' + letters[1] + '*256+' + letters[2]
    } else {
      rawExpr = letters[2] + '*65536+' + letters[1] + '*256+' + letters[0]
    }
  } else if (pid.ds === 4) {
    if (isBigEndian) {
      rawExpr = letters[0] + '*16777216+' + letters[1] + '*65536+' + letters[2] + '*256+' + letters[3]
    } else {
      rawExpr = letters[3] + '*16777216+' + letters[2] + '*65536+' + letters[1] + '*256+' + letters[0]
    }
  } else {
    // Unsupported size
    return null
  }

  // Apply multiplier
  var expr = rawExpr
  if (mul !== 1) {
    // Wrap compound expression in parens before multiplying
    var needsParen = rawExpr.indexOf('+') !== -1 || rawExpr.indexOf('-') !== -1 || rawExpr.indexOf('*') !== -1
    if (needsParen && !rawExpr.startsWith('ShortSigned') && !rawExpr.startsWith('signed(')) {
      expr = '(' + rawExpr + ')*' + fmtNum(mul)
    } else {
      expr = rawExpr + '*' + fmtNum(mul)
    }
  }

  // Apply offset
  if (ofs > 0) {
    expr = expr + '+' + fmtNum(ofs)
  } else if (ofs < 0) {
    expr = expr + fmtNum(ofs)  // fmtNum(-40) = "-40"
  }

  return expr
}

/**
 * Build a Car Scanner equation string for a bit field PID.
 * Returns the FR string, or null if not generatable.
 */
function buildBitFR(pid) {
  var parsed = parseBitRule(pid.cr)
  if (!parsed) return null

  var letter = letterNum(pid.dp - 3)

  if (parsed.type === 'single_bit') {
    return 'GetBit(' + letter + ',' + parsed.bitStart + ')'
  }

  if (parsed.type === 'multi_bit') {
    // Car Scanner's GetBit only extracts one bit at a time.
    // For multi-bit ranges (e.g. Bit2,3), return the start bit as best effort.
    // The user can manually adjust in Car Scanner if needed.
    return 'GetBit(' + letter + ',' + parsed.bitStart + ')'
  }

  // Value mask / Bit mask: return raw byte value (user reads the label)
  return letter
}

/**
 * Main entry: build Car Scanner FR string for a PID.
 * @param {object} pid - entry from pids.json (with dp, dst, ds, bt, cr, etc.)
 * @returns {string|null} FR equation string for Car Scanner, or null on failure
 */
function buildCarScannerFR(pid) {
  if (pid.dst === 0) {
    return buildNumericFR(pid)
  }
  if (pid.dst === 1) {
    return buildBitFR(pid)
  }
  return null
}

/**
 * Extract MUL, OFS, SIG from conv_rule for the CSP JSON fields.
 * Returns { mul, ofs, sig } for numeric PIDs.
 * Returns null for bit field PIDs.
 */
function extractCspNumbers(pid) {
  if (pid.dst !== 0) return null
  var parsed = parseNumericRule(pid.cr)
  if (!parsed) return null
  return { mul: parsed.mul, ofs: parsed.ofs, sig: parsed.signed }
}

module.exports = {
  letterNum,
  getLetters,
  parseNumericRule,
  parseBitRule,
  buildCarScannerFR,
  extractCspNumbers,
}
