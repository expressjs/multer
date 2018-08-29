var concat = require('concat-stream')

function MemoryStorage (opts) {}

MemoryStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  file.stream.pipe(concat(function (data) {
    file.buffer = data
    file.size = data.length
    cb(null)
  }))
}

MemoryStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  delete file.buffer
  cb(null)
}

module.exports = function (opts) {
  return new MemoryStorage(opts)
}
