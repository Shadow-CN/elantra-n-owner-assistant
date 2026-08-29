/**
 * pidData.js
 *
 * Loads pids.json once and provides query/filter functions.
 * All data access should go through this module.
 *
 * pids.json field reference:
 *   id       - parameter_id (string)
 *   name_en  - English parameter name
 *   name_cn  - Chinese parameter name
 *   ecu      - ecu_name_en
 *   rh       - request_header
 *   rsp      - response_header
 *   cmd      - request_cmd (no spaces, uppercase)
 *   did      - pid_did (no spaces, uppercase)
 *   dp       - data_pos (integer)
 *   dst      - data_size_type (0=numeric, 1=bit field)
 *   ds       - data_size (bytes for numeric, bits for bit field)
 *   bt       - bit_type (0=big-endian, 1=little-endian)
 *   cr       - conv_rule
 *   mn       - min value (float or null)
 *   mx       - max value (float or null)
 *   unit     - unit string
 *   pt       - decimal point count
 *   soc      - session_open_cmd
 *   tpc      - tester_present_cmd
 */

const { getEcuCategory } = require('./ecuCategories')
const { getParamType } = require('./paramTypes')

let _allPids = null   // cached array after first load
let _pidMap = null    // id -> pid object

/**
 * Load and cache pids.json. Safe to call multiple times (loads once).
 * Returns the full array.
 */
function loadPids() {
  if (_allPids !== null) return _allPids

  // require() works for JSON in WeChat mini-program
  const raw = require('../data/pids.json')

  // Augment each entry with derived fields (ecu_group, param_type)
  // so pages don't need to call getEcuCategory / getParamType themselves.
  _allPids = raw.map(function(pid) {
    const ecuCat = getEcuCategory(pid.ecu)
    return Object.assign({}, pid, {
      ecu_group: ecuCat.group,
      ecu_label: ecuCat.label,
      param_type: getParamType(pid),
    })
  })

  // Build id lookup map
  _pidMap = {}
  _allPids.forEach(function(pid) {
    _pidMap[pid.id] = pid
  })

  return _allPids
}

/**
 * Get a single PID by id string.
 * Returns undefined if not found.
 */
function getPidById(id) {
  if (_pidMap === null) loadPids()
  return _pidMap[id]
}

/**
 * Get all PIDs (loads if needed).
 */
function getAllPids() {
  return loadPids()
}

/**
 * Filter PIDs by ECU group and/or param type.
 * Pass empty string '' to skip that filter dimension.
 *
 * @param {string} ecuGroup  - ECU group key, or '' for all
 * @param {string} paramType - param type key, or '' for all
 * @returns {Array} filtered array
 */
function filterPids(ecuGroup, paramType) {
  const all = loadPids()
  return all.filter(function(pid) {
    if (ecuGroup && pid.ecu_group !== ecuGroup) return false
    if (paramType && pid.param_type !== paramType) return false
    return true
  })
}

/**
 * Get multiple PIDs by an array of id strings.
 * Preserves selection order. Skips unknown ids.
 */
function getPidsByIds(ids) {
  if (_pidMap === null) loadPids()
  return ids
    .map(function(id) { return _pidMap[id] })
    .filter(function(pid) { return pid !== undefined })
}

/**
 * Return a summary of ECU counts across all PIDs.
 * Useful for showing "(N)" badge next to each ECU group.
 * Returns { ecuGroup: count }
 */
function getEcuCounts() {
  const all = loadPids()
  const counts = {}
  all.forEach(function(pid) {
    const g = pid.ecu_group
    counts[g] = (counts[g] || 0) + 1
  })
  return counts
}

/**
 * Return a summary of param type counts across all PIDs,
 * optionally pre-filtered by ECU group.
 * Returns { paramType: count }
 */
function getTypeCounts(ecuGroup) {
  const list = ecuGroup ? filterPids(ecuGroup, '') : loadPids()
  const counts = {}
  list.forEach(function(pid) {
    const t = pid.param_type
    counts[t] = (counts[t] || 0) + 1
  })
  return counts
}

module.exports = {
  getAllPids,
  getPidById,
  getPidsByIds,
  filterPids,
  getEcuCounts,
  getTypeCounts,
}
