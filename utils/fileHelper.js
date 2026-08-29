/**
 * fileHelper.js
 *
 * Saves a string as a file in the WeChat mini-program temp directory
 * and triggers the system share sheet so the user can send/save it.
 *
 * WeChat mini-program file system notes:
 * - wx.getFileSystemManager() provides local file I/O.
 * - wx.env.USER_DATA_PATH is the persistent user data directory.
 * - wx.shareFileMessage is available since base library 2.11.0.
 * - The file must exist at a permanent path (not just temp) before sharing.
 */

/**
 * Save content to a named file under USER_DATA_PATH and open the share sheet.
 *
 * @param {string} fileName  - e.g. "custompids.csp"
 * @param {string} content   - file content (UTF-8 string)
 * @param {function} onSuccess  - called with { filePath } on success
 * @param {function} onError    - called with { message } on failure
 */
function saveAndShare(fileName, content, onSuccess, onError) {
  var fs = wx.getFileSystemManager()
  var filePath = wx.env.USER_DATA_PATH + '/' + fileName

  fs.writeFile({
    filePath: filePath,
    data: content,
    encoding: 'utf8',
    success: function() {
      // Use shareFileMessage to open system share sheet
      wx.shareFileMessage({
        filePath: filePath,
        fileName: fileName,
        success: function(res) {
          if (typeof onSuccess === 'function') onSuccess({ filePath: filePath })
        },
        fail: function(err) {
          // shareFileMessage may not be available in all environments (e.g. devtools)
          // Fall back to saving to album or showing file path
          console.warn('[fileHelper] shareFileMessage failed:', err)

          // Try to open the file via wx.openDocument as fallback
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: function() {
              if (typeof onSuccess === 'function') onSuccess({ filePath: filePath })
            },
            fail: function(err2) {
              console.error('[fileHelper] openDocument also failed:', err2)
              // Final fallback: report path so user knows where file is
              if (typeof onSuccess === 'function') {
                onSuccess({ filePath: filePath, fallback: true })
              }
            }
          })
        }
      })
    },
    fail: function(err) {
      console.error('[fileHelper] writeFile failed:', err)
      if (typeof onError === 'function') {
        onError({ message: '文件写入失败: ' + (err.errMsg || JSON.stringify(err)) })
      }
    }
  })
}

module.exports = { saveAndShare }
