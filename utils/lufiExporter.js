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

var buildZip = require('./zip').buildZip

function base64ToBytes(base64) {
  if (typeof wx !== 'undefined' && wx.base64ToArrayBuffer) {
    return new Uint8Array(wx.base64ToArrayBuffer(base64))
  }
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
  throw new Error('Current runtime cannot decode base64')
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
