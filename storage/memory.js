var concat = require('concat-stream')

function MemoryStorage (opts) {}

MemoryStorage.prototype.handleFile = function handleFile (req, file, cb) {
  file.stream.pipe(concat(function (data) {
    cb(null, {
      buffer: data,
      size: data.length
    })
  }))
}

module.exports = function (opts) {
  return new MemoryStorage(opts)
}
