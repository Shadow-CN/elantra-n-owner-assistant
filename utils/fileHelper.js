/**
 * fileHelper.js
 *
 * Saves a string as a file and triggers the system share sheet.
 *
 * Key constraint:
 *   wx.shareFileMessage must be called within the synchronous call stack
 *   of a user tap event. Using writeFileSync (not writeFile) keeps the
 *   entire flow synchronous, satisfying this requirement.
 */

/**
 * Write content to USER_DATA_PATH/<fileName> and open the share sheet.
 *
 * Must be called directly from a user tap handler (no async gap before this call).
 *
 * @param {string} fileName   e.g. "custompids.csp"
 * @param {string} content    UTF-8 string content
 * @param {function} onSuccess  called with { filePath, shareSkipped? }
 * @param {function} onError    called with { message }
 */
function saveAndShare(fileName, content, onSuccess, onError) {
  var fs = wx.getFileSystemManager()
  var filePath = wx.env.USER_DATA_PATH + '/' + fileName

  // Synchronous write — keeps us within the user tap gesture context
  try {
    fs.writeFileSync(filePath, content, 'utf8')
  } catch (e) {
    console.error('[fileHelper] writeFileSync failed:', e)
    if (typeof onError === 'function') {
      onError({ message: '文件写入失败: ' + (e.message || JSON.stringify(e)) })
    }
    return
  }

  // Call shareFileMessage immediately (still synchronous, still in tap context)
  wx.shareFileMessage({
    filePath: filePath,
    fileName: fileName,
    success: function() {
      if (typeof onSuccess === 'function') onSuccess({ filePath: filePath })
    },
    fail: function(err) {
      // shareFileMessage may not be available in devtools or some environments.
      // The file is already written; just report success with a note.
      console.warn('[fileHelper] shareFileMessage failed:', err)
      if (typeof onSuccess === 'function') {
        onSuccess({ filePath: filePath, shareSkipped: true })
      }
    },
  })
}

module.exports = { saveAndShare }
