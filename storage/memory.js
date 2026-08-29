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

module.exports = function (opts) {
  return new MemoryStorage(opts)
}
