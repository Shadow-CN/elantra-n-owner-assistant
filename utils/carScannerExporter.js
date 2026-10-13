/**
 * carScannerExporter.js
 *
 * Generates a Car Scanner custom PID file (.csp) from selected PIDs.
 *
 * CSP format: JSON array of PID objects.
 * Field reference derived from docs/examples/car-scanner/custompids.csp:
 *
 *   CMD       - request command (no spaces, uppercase): "2201A5"
 *   HDR       - request header: "7E1"
 *   FR        - equation string: "G-40", "ShortSigned(AH,AI)*0.1"
 *   MUL       - multiplier (float)
 *   DIV       - divisor (always 1.0)
 *   OFS       - offset (float)
 *   SIG       - signed flag (boolean)
 *   DL        - data length in bytes
 *   BIT       - bit position (0 for numeric PIDs)
 *   TP        - type: 0=numeric, 1=bit field
 *   NM        - display name (Chinese preferred)
 *   SNM       - short name (English)
 *   MIN       - min value
 *   MAX       - max value
 *   UN        - Car Scanner unit code (see UNIT_CODE_MAP)
 *   Id        - numeric parameter ID
 *   VIS       - visible (true)
 *   SBI       - start byte index (0)
 *   RBS       - false
 *   FHID      - false
 *   ORD       - display order (-1 = auto)
 *   TVV       - target vehicle value (null)
 *   BCM       - blank
 *   ACM       - blank
 *   ACT       - false
 *   TRNS      - transitions array (empty)
 *   RL        - 0
 *   SkipCycles - 0
 *   ABRPRole  - 0
 */

var formulaParser = require('./formulaParser')

/**
 * Car Scanner unit code map.
 * Derived from known values in the sample file (UN=15 → °C).
 * For unknown units, falls back to 0 (no unit / custom string).
 * These codes are specific to the Car Scanner app version in use;
 * if a code is wrong, the unit label in the app will differ but data stays correct.
 */
var UNIT_CODE_MAP = {
  '°C':     15,
  'rpm':    4,
  'km/h':   3,
  'V':      2,
  'A':      11,
  'mA':     11,
  '%':      1,
  'kPa':    14,
  'hPa':    14,
  'bar':    13,
  'psi':    16,
  'MPa':    14,
  'deg':    6,
  'DEG':    6,
  'Nm':     20,
  'ms':     5,
  'km':     3,
  'mm':     0,
  'Ohm':    0,
  'G':      0,
}

function getUnitCode(unit) {
  if (!unit) return 0
  return UNIT_CODE_MAP[unit] !== undefined ? UNIT_CODE_MAP[unit] : 0
}

/**
 * Convert a single PID entry to a Car Scanner CSP object.
 * Returns null if the PID cannot be converted (e.g., unsupported formula).
 */
function pidToCspEntry(pid, index) {
  var fr = formulaParser.buildCarScannerFR(pid)
  if (fr === null) {
    // Cannot generate formula → skip
    return null
  }

  var nums = formulaParser.extractCspNumbers(pid)
  var mul = 1.0
  var ofs = 0.0
  var sig = false
  if (nums !== null) {
    mul = nums.mul
    ofs = nums.ofs
    sig = nums.sig
  }

  var isBitField = pid.dst === 1
  var bitNum = 0
  if (isBitField) {
    var bitParsed = formulaParser.parseBitRule(pid.cr)
    if (bitParsed && bitParsed.type === 'single_bit') {
      bitNum = bitParsed.bitStart
    }
  }

  var displayName = pid.name_cn || pid.name_en
  var shortName = pid.name_en

  // Truncate names to avoid potential Car Scanner length limits
  if (displayName.length > 64) displayName = displayName.substring(0, 64)
  if (shortName.length > 64) shortName = shortName.substring(0, 64)

  return {
    CMD: pid.cmd,
    SBI: 0,
    DL: pid.ds,
    MUL: mul,
    DIV: 1.0,
    OFS: ofs,
    SIG: sig,
    TP: isBitField ? 1 : 0,
    BIT: bitNum,
    FHID: false,
    RBS: false,
    ORD: index,
    TVV: null,
    FR: fr,
    UN: getUnitCode(pid.unit),
    BCM: '',
    ACM: '',
    ACT: false,
    TRNS: [],
    NM: displayName,
    SNM: shortName,
    HDR: pid.rh,
    RL: 0,
    MAX: pid.mx !== null ? pid.mx : 0.0,
    MIN: pid.mn !== null ? pid.mn : 0.0,
    Id: parseInt(pid.id, 10) || index + 1000,
    VIS: true,
    SkipCycles: 0,
    ABRPRole: 0,
  }
}

/**
 * Generate a Car Scanner CSP file content (JSON string) from an array of PIDs.
 *
 * @param {Array} pids - array of PID objects from pids.json (already loaded)
 * @returns {{ content: string, total: number, skipped: number, skippedNames: string[] }}
 */
function generateCsp(pids) {
  var entries = []
  var skippedNames = []

  pids.forEach(function(pid, i) {
    var entry = pidToCspEntry(pid, i)
    if (entry !== null) {
      entries.push(entry)
    } else {
      skippedNames.push(pid.name_en)
    }
  })

  var content = JSON.stringify(entries)

  return {
    content: content,
    total: entries.length,
    skipped: skippedNames.length,
    skippedNames: skippedNames,
  }
}

module.exports = { generateCsp, pidToCspEntry, getUnitCode }
