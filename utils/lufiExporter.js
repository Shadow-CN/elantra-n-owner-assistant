/**
 * LUFI XF exporter.
 *
 * LUFI uses one binary .INI per channel. The app shares one file per tap, so
 * selected channel templates are bundled into a small ZIP archive.
 */
var lufiTemplates = require('./lufiTemplates')

var channelsById = {}
lufiTemplates.channels.forEach(function(channel) {
  channelsById[String(channel.id)] = channel
})

var crcTable = null

function makeCrcTable() {
  var table = []
  for (var n = 0; n < 256; n++) {
    var c = n
    for (var k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[n] = c >>> 0
  }
  return table
}

function crc32(bytes) {
  if (!crcTable) crcTable = makeCrcTable()
  var crc = 0xFFFFFFFF
  for (var i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function asciiBytes(text) {
  var bytes = new Uint8Array(text.length)
  for (var i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xFF
  }
  return bytes
}

function base64ToBytes(base64) {
  if (typeof wx !== 'undefined' && wx.base64ToArrayBuffer) {
    return new Uint8Array(wx.base64ToArrayBuffer(base64))
  }
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
  throw new Error('Current runtime cannot decode base64')
}

function writeU16LE(bytes, offset, value) {
  bytes[offset] = value & 0xFF
  bytes[offset + 1] = (value >>> 8) & 0xFF
}

function writeU32LE(bytes, offset, value) {
  bytes[offset] = value & 0xFF
  bytes[offset + 1] = (value >>> 8) & 0xFF
  bytes[offset + 2] = (value >>> 16) & 0xFF
  bytes[offset + 3] = (value >>> 24) & 0xFF
}

function copyBytes(target, offset, source) {
  target.set(source, offset)
  return offset + source.length
}

function dosDateTime(date) {
  var year = Math.max(1980, date.getFullYear())
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  }
}

function buildZip(entries) {
  var now = dosDateTime(new Date())
  var localParts = []
  var centralParts = []
  var offset = 0

  entries.forEach(function(entry) {
    var nameBytes = asciiBytes(entry.name)
    var data = entry.data
    var crc = crc32(data)
    var local = new Uint8Array(30 + nameBytes.length + data.length)

    writeU32LE(local, 0, 0x04034B50)
    writeU16LE(local, 4, 20)
    writeU16LE(local, 6, 0)
    writeU16LE(local, 8, 0)
    writeU16LE(local, 10, now.time)
    writeU16LE(local, 12, now.date)
    writeU32LE(local, 14, crc)
    writeU32LE(local, 18, data.length)
    writeU32LE(local, 22, data.length)
    writeU16LE(local, 26, nameBytes.length)
    writeU16LE(local, 28, 0)
    copyBytes(local, 30, nameBytes)
    copyBytes(local, 30 + nameBytes.length, data)
    localParts.push(local)

    var central = new Uint8Array(46 + nameBytes.length)
    writeU32LE(central, 0, 0x02014B50)
    writeU16LE(central, 4, 20)
    writeU16LE(central, 6, 20)
    writeU16LE(central, 8, 0)
    writeU16LE(central, 10, 0)
    writeU16LE(central, 12, now.time)
    writeU16LE(central, 14, now.date)
    writeU32LE(central, 16, crc)
    writeU32LE(central, 20, data.length)
    writeU32LE(central, 24, data.length)
    writeU16LE(central, 28, nameBytes.length)
    writeU16LE(central, 30, 0)
    writeU16LE(central, 32, 0)
    writeU16LE(central, 34, 0)
    writeU16LE(central, 36, 0)
    writeU32LE(central, 38, 0)
    writeU32LE(central, 42, offset)
    copyBytes(central, 46, nameBytes)
    centralParts.push(central)

    offset += local.length
  })

  var centralSize = centralParts.reduce(function(sum, part) { return sum + part.length }, 0)
  var totalSize = offset + centralSize + 22
  var zip = new Uint8Array(totalSize)
  var cursor = 0
  localParts.concat(centralParts).forEach(function(part) {
    cursor = copyBytes(zip, cursor, part)
  })

  writeU32LE(zip, cursor, 0x06054B50)
  writeU16LE(zip, cursor + 4, 0)
  writeU16LE(zip, cursor + 6, 0)
  writeU16LE(zip, cursor + 8, entries.length)
  writeU16LE(zip, cursor + 10, entries.length)
  writeU32LE(zip, cursor + 12, centralSize)
  writeU32LE(zip, cursor + 16, offset)
  writeU16LE(zip, cursor + 20, 0)

  return zip.buffer
}

function isSameChannel(pid, channel) {
  return String(pid.rh || '').toUpperCase() === channel.requestHeader &&
    String(pid.rsp || '').toUpperCase() === channel.responseHeader &&
    String(pid.cmd || '').toUpperCase() === channel.request.replace(/\s+/g, '').replace(/^03/, '') &&
    Number(pid.dp) === channel.dataPos &&
    Number(pid.ds) === channel.dataSize
}

function generateZip(pids) {
  var entries = []
  var exported = []
  var skipped = 0
  var seen = {}

  ;(pids || []).forEach(function(pid) {
    var channel = channelsById[String(pid.id)]
    if (!channel || !isSameChannel(pid, channel) || seen[channel.fileName]) {
      skipped++
      return
    }
    seen[channel.fileName] = true
    entries.push({
      name: channel.fileName,
      data: base64ToBytes(channel.base64),
    })
    exported.push({
      id: channel.id,
      fileName: channel.fileName,
      displayName: channel.displayName,
      description: channel.description,
    })
  })

  return {
    fileName: 'cn7n_lufi_xf.zip',
    content: entries.length ? buildZip(entries) : null,
    total: entries.length,
    skipped: skipped,
    exported: exported,
  }
}

function getSupportedIds() {
  return lufiTemplates.channels.map(function(channel) {
    return channel.id
  })
}

module.exports = {
  generateZip: generateZip,
  getSupportedIds: getSupportedIds,
}
