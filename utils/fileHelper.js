/**
 * fileHelper.js
 *
 * Saves a file and triggers the system share sheet.
 *
 * wx.shareFileMessage must be called within the synchronous call stack of a
 * user tap event. Using writeFileSync keeps the flow synchronous.
 */

function writeAndShare(fileName, content, encoding, onSuccess, onError) {
  var fs = wx.getFileSystemManager()
  var filePath = wx.env.USER_DATA_PATH + '/' + fileName

  try {
    if (encoding) {
      fs.writeFileSync(filePath, content, encoding)
    } else {
      fs.writeFileSync(filePath, content)
    }
  } catch (e) {
    console.error('[fileHelper] writeFileSync failed:', e)
    if (typeof onError === 'function') {
      onError({ message: '文件写入失败: ' + (e.message || JSON.stringify(e)) })
    }
    return
  }

  wx.shareFileMessage({
    filePath: filePath,
    fileName: fileName,
    success: function() {
      if (typeof onSuccess === 'function') onSuccess({ filePath: filePath })
    },
    fail: function(err) {
      console.warn('[fileHelper] shareFileMessage failed:', err)
      if (typeof onSuccess === 'function') {
        onSuccess({ filePath: filePath, shareSkipped: true })
      }
    },
  })
}

function saveAndShare(fileName, content, onSuccess, onError) {
  writeAndShare(fileName, content, 'utf8', onSuccess, onError)
}

function saveBinaryAndShare(fileName, content, onSuccess, onError) {
  writeAndShare(fileName, content, '', onSuccess, onError)
}

module.exports = {
  saveAndShare: saveAndShare,
  saveBinaryAndShare: saveBinaryAndShare,
}
