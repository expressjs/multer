var concat = require('concat-stream')

function MemoryStorage (opts) {}

MemoryStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  file.stream.pipe(concat(function (data) {
    cb(null, {
      buffer: data,
      size: data.length
    })
  }))
}

MemoryStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  cb(null) // Will be garbage collected automatically
}

module.exports = function (opts) {
  return new MemoryStorage(opts)
}
