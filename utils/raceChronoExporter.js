var parser = require('./formulaParser')
var channels = require('./raceChronoChannels')

var FIELD_LABELS = ['通道', '通道后缀', 'OBD-II标头', 'OBD-II反馈前缀', 'PID', '源数据', '计算式']

function floatText(value) {
  var text = String(value)
  return /[.eE]/.test(text) ? text : text + '.0'
}

function channelFor(pid) {
  return channels.channelFor(pid)
}

function buildEquation(pid) {
  var offset = pid.dp - 3
  if (!Number.isInteger(offset) || offset < 0) throw new Error('数据位置无效')
  var notes = []
  var bytes = 1
  var expression
  if (pid.dst === 0) {
    var rule = parser.parseNumericRule(pid.cr)
    if (!rule || !Number.isInteger(pid.ds) || pid.ds < 1 || pid.ds > 4) {
      throw new Error('数值公式或长度不支持')
    }
    if (pid.bt !== 0 && pid.bt !== 1) throw new Error('字节序未定义')
    bytes = pid.ds
    var fn = rule.signed ? 'bytesToInt' : 'bytesToUint'
    if (bytes > 1 && pid.bt === 1) fn += 'Le'
    expression = fn + '(raw,' + offset + ',' + bytes + ')'
    if (rule.mul !== 1) expression += ' * ' + floatText(rule.mul)
    if (rule.ofs > 0) expression += ' + ' + floatText(rule.ofs)
    if (rule.ofs < 0) expression += ' - ' + floatText(-rule.ofs)
  } else if (pid.dst === 1) {
    var bitRule = pid.cr.match(/^\(Bit([0-9,]+)\s*=\s*0x([0-9a-f]+)\)/i)
    var rawByte = 'bytesToUint(raw,' + offset + ',1)'
    if (bitRule) {
      var bits = bitRule[1].split(',').map(Number).sort(function(a, b) { return a - b })
      var mask = parseInt(bitRule[2], 16)
      var expectedMask = bits.reduce(function(sum, bit) { return sum + Math.pow(2, bit) }, 0)
      if (bits.some(function(bit) { return bit < 0 || bit > 7 }) || mask !== expectedMask) {
        throw new Error('位掩码与位列表不一致')
      }
      var hexMask = '0x' + mask.toString(16).toUpperCase().padStart(2, '0')
      expression = '(' + rawByte + ' & ' + hexMask + ')'
      if (bits.every(function(bit, i) { return bit === bits[0] + i })) {
        if (bits[0] > 0) expression += ' >> ' + bits[0]
      } else {
        expression = bits.map(function(bit, i) {
          return '((' + rawByte + ' >> ' + bit + ') & 1) * ' + Math.pow(2, i)
        }).join(' + ')
      }
    } else if (/^\((Value|Bit) Mask\)/i.test(pid.cr)) {
      // These source rules enumerate byte values; data_size is not a byte count.
      expression = rawByte
      notes.push('枚举/掩码以原始代码显示，含义见源规则；未配置状态文字。')
    } else {
      throw new Error('位域规则无法解析')
    }
    notes.push('状态以整数显示，源数据的 data_size 不作为读取字节数。')
  } else {
    throw new Error('数据类型未定义')
  }

  var channel = channelFor(pid)
  if (pid.unit === 'km/h' && pid.dst === 0) {
    expression = '(' + expression + ') / 3.6'
  } else if (channel.factor !== 1) {
    expression = '(' + expression + ') * ' + floatText(channel.factor)
  }
  if (pid.id === '179849') expression = 'bytesToInt(raw,26,2) / 10.0'
  if (pid.id === '179854') {
    expression = 'bytesToInt(raw,33,2) / 65.536 * 100.0'
    notes.push('采用实车验证公式；1/65.536 与源表的 0.0153 略有差异。')
  }
  if (channel.id === 'analog' && pid.unit) notes.push('模拟通道数值保留源单位 ' + pid.unit + '，不自动换算。')
  if (/^tyre_/.test(channel.id) && !channel.position) notes.push('源数据未标明轮位，不推断左前/右前/左后/右后。')
  return { equation: expression, byteCount: bytes, channel: channel, notes: notes }
}

function pidToEntry(pid) {
  var result = buildEquation(pid)
  var sourceData = '0x ' + new Array(pid.dp - 3 + result.byteCount + 1).join('00 ').trim()
  return {
    id: String(pid.id), name: pid.name_cn || pid.name_en, nameEn: pid.name_en,
    ecu: pid.ecu_label || pid.ecu, sourceUnit: pid.unit || '无', sourceRule: pid.cr,
    channelId: result.channel.id, inputUnit: result.channel.unit,
    position: result.channel.position, preferredNumber: result.channel.preferredNumber,
    priority: result.channel.priority, mappingBasis: result.channel.basis,
    notes: result.notes, verified: pid.id === '179849' || pid.id === '179854',
    values: [result.channel.name, '', '0x' + pid.rh, '', '0x' + pid.cmd, sourceData, result.equation],
  }
}

function generate(pids) {
  var slots = {}
  var entries = []
  var errors = []
  pids.forEach(function(pid) {
    try {
      var entry = pidToEntry(pid)
      entries.push(entry)
    } catch (err) {
      errors.push({ id: String(pid.id), name: pid.name_cn || pid.name_en, reason: err.message })
    }
  })
  entries.slice().sort(function(a, b) {
    return a.priority - b.priority || (a.preferredNumber === null ? 1 : 0) - (b.preferredNumber === null ? 1 : 0) || Number(a.id) - Number(b.id)
  }).forEach(function(entry) {
    var key = entry.channelId + ':' + entry.position
    var groups = slots[key] || (slots[key] = [new Set()])
    var group = 0
    var number = entry.preferredNumber === null ? 0 : entry.preferredNumber
    while (groups[group].has(number)) {
      number = 0
      while (number < 64 && groups[group].has(number)) number++
      if (number === 64) {
        group++
        if (!groups[group]) groups[group] = new Set()
        number = entry.preferredNumber === null ? 0 : entry.preferredNumber
      }
    }
    groups[group].add(number)
    entry.values[1] = channels.postfix(entry.position, number)
    entry.channelIdentifier = channels.identifier(entry.channelId, entry.position, number)
    entry.profileGroup = group + 1
    if (entry.profileGroup > 1) entry.notes.push('此通道编号需放入车辆配置组 ' + entry.profileGroup + '，避免与前组重名。')
    entry.fields = FIELD_LABELS.map(function(label, i) {
      return { label: label, value: entry.values[i] || '无', copyValue: entry.values[i] }
    })
  })
  return { entries: entries, errors: errors, total: entries.length, skipped: errors.length }
}

function toMarkdown(result) {
  var lines = ['# 伊兰特 N RaceChrono 配置清单', '',
    '共 ' + result.total + ' 条配置；未转换 ' + result.skipped + ' 条。', '',
    '按自定义 OBD-II 通道填写。无后缀/无反馈前缀表示留空；反馈前缀使用 RC 自动处理，不填响应 CAN ID。',
    '源数据是足够覆盖目标偏移的全零模拟测试数据，不是请求内容或实车回复。',
    '压力公式输出 kPa，速度公式输出 m/s；最终显示单位由 RaceChrono 设置决定。',
    '偏移采用本车 Mode 22 的 data_pos - 3。字节序沿用源数据解释：bit_type=0 大端、1 小端。',
    '只有标注实车验证的示例已有读取证据，其余为源数据推导；会话/保活、适配器兼容性和长回复需实测。',
    '优先按参数含义和单位选择官方专用通道；无法确认时使用通用或模拟通道，并列出映射依据。中文名称是显示译名，以官方通道标识为准。',
    '后缀包含位置 FL/FR/RL/RR/FRONT/REAR，可与数字组合（如 FL 1）；含义是传感器位置和同类编号，不是 PID 或字节偏移。',
    '同一基础通道和位置超过无编号及 1–63 编号的容量时，分配到另一个车辆配置组；本清单不代表应同时轮询全部参数。', '',
    '官方参考：[公式](https://racechrono.com/support/equations)、[通道标识](https://racechrono.com/support/equations/identifiers)、[压力单位](https://racechrono.com/forum/d/2261-2261)、[通道与单位说明](https://racechrono.com/forum/d/2001-2001?page=2)。', '']
  result.entries.forEach(function(entry) {
    lines.push('## ' + entry.id + ' ' + entry.name, '', entry.nameEn + ' · ' + entry.ecu,
      '', '通道标识：`' + entry.channelIdentifier + '`；公式输出单位：' + entry.inputUnit + '；配置组：' + entry.profileGroup,
      '', '映射依据：' + entry.mappingBasis,
      '', entry.verified ? '状态：实车验证示例。' : '状态：源数据推导，待实测。', '')
    entry.fields.forEach(function(field) { lines.push('- ' + field.label + '：`' + field.value + '`') })
    lines.push('', '源转换规则：`' + entry.sourceRule + '`', '')
    entry.notes.forEach(function(note) { lines.push('- ' + note) })
    lines.push('')
  })
  if (result.errors.length) {
    lines.push('## 未转换参数', '')
    result.errors.forEach(function(error) { lines.push('- ' + error.id + ' ' + error.name + '：' + error.reason) })
  }
  return lines.join('\n') + '\n'
}

module.exports = { generate: generate, pidToEntry: pidToEntry, buildEquation: buildEquation, toMarkdown: toMarkdown }
