// jshint asi:true

var fs = require('fs')
var os = require('os')
var path = require('path')
var crypto = require('crypto')
var mkdirp = require('mkdirp')

function getFilename (req, file, cb) {
  crypto.pseudoRandomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'))
  })
}

function getDestination (req, file, cb) {
  cb(null, os.tmpdir())
}

function EncryptStorage (opts) {
  this.getFilename = (opts.filename || getFilename)

  if (typeof opts.destination === 'string') {
    mkdirp.sync(opts.destination)
    this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
  } else {
    this.getDestination = (opts.destination || getDestination)
  }
  this.memory_only = (opts.memory_only || false)
}

EncryptStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  var that = this

  that.getDestination(req, file, function (err, destination) {
    if (err) return cb(err)

    that.getFilename(req, file, function (err, filename) {
      if (err) return cb(err)


      var finalPath = path.join(destination, filename)
      var key = crypto.randomBytes(32).toString('hex')
      var cipher = crypto.createCipher('aes-256-xts', key);
      if (that.memory_only) {
        var outMemStream = fs.createWriteStream(finalPath)
        file.stream.pipe(cipher).pipe(outMemStream)
        outMemStream.on('finish', function() {
          cb(null, {
            destination: destination,
            filename: filename,
            path: finalPath,
            encryptionKey: key,
            size: outMemStream.bytesWritten
          })
        })
      }
      else {
        var outStream = fs.createWriteStream(finalPath+'.tmp.original')
        file.stream.pipe(outStream)
        outStream.on('error', cb)
        outStream.on('finish', function () {
          var input = fs.createReadStream(finalPath+'.tmp.original')
          var output = fs.createWriteStream(finalPath);

          input.pipe(cipher).pipe(output);
          output.on('finish', function() {
            fs.unlink(finalPath+'.tmp.original', function() {
              cb(null, {
                destination: destination,
                filename: filename,
                path: finalPath,
                encryptionKey: key,
                size: outStream.bytesWritten
              })
            })
          })
        })
      }
    })
  })
}

EncryptStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  var path = file.path

  delete file.destination
  delete file.filename
  delete file.path

  fs.unlink(path, cb)
}

module.exports = function (opts) {
  return new EncryptStorage(opts)
}
