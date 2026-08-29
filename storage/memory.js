/**
 * Storage engine that keeps files in memory.
 *
 * @constructor
 * @private
 */
function MemoryStorage (opts) {}

MemoryStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  var chunks = []

  file.stream.on('data', function (chunk) {
    chunks.push(chunk)
  })

  file.stream.on('end', function () {
    var buffer = Buffer.concat(chunks)

    cb(null, {
      buffer: buffer,
      size: buffer.length
    })
  })
}

MemoryStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  delete file.buffer
  cb(null)
}

/**
 * Create a memory storage engine. Sets `buffer` on the file object with the
 * whole file contents; set `limits.fileSize` to bound memory use.
 *
 * @returns {MemoryStorage}
 */
module.exports = function (opts) {
  return new MemoryStorage(opts)
}
