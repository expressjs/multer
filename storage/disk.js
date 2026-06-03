var fs = require('fs')
var os = require('os')
var path = require('path')
var crypto = require('crypto')

function getFilename (req, file, cb) {
  crypto.randomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'))
  })
}

function getDestination (req, file, cb) {
  cb(null, os.tmpdir())
}

function DiskStorage (opts) {
  this.getFilename = (opts.filename || getFilename)
  // When `flush` is truthy, the disk storage asks the underlying write
  // stream to fdatasync() the uploaded file before `_handleFile` reports
  // success, so callers that expect the data to survive a crash or power
  // loss (see #1381) can rely on it. The option is forwarded as
  // `fs.createWriteStream(..., { flush: true })`, which was added in
  // Node.js 20.10 / 21.0. On older runtimes the option is ignored and
  // behavior falls back to the previous buffered-write semantics.
  this.flush = opts.flush === true

  if (typeof opts.destination === 'string') {
    fs.mkdirSync(opts.destination, { recursive: true })
    this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
  } else {
    this.getDestination = (opts.destination || getDestination)
  }
}

DiskStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  var that = this

  that.getDestination(req, file, function (err, destination) {
    if (err) return cb(err)

    that.getFilename(req, file, function (err, filename) {
      if (err) return cb(err)

      var finalPath = path.join(destination, filename)
      var writeStreamOptions = that.flush ? { flush: true } : undefined
      var outStream = fs.createWriteStream(finalPath, writeStreamOptions)

      file.stream.pipe(outStream)
      outStream.on('error', cb)
      outStream.on('finish', function () {
        cb(null, {
          destination: destination,
          filename: filename,
          path: finalPath,
          size: outStream.bytesWritten
        })
      })
    })
  })
}

DiskStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  var path = file.path

  delete file.destination
  delete file.filename
  delete file.path

  fs.unlink(path, cb)
}

module.exports = function (opts) {
  return new DiskStorage(opts)
}
