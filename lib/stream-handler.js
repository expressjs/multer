var crytpo = require('crypto')
var fs = require('fs')
var path = require('path')
var isStream = require('is-stream')

function randomBytes () {
  return new Promise(function (resolve, reject) {
    crytpo.randomBytes(16, function (err, buf) {
      if (err) {
        return reject(err)
      }
      resolve(buf)
    })
  })
}

module.exports.createHandler = function createHandler (destination) {
  return function handler (req, file) {
    var stream

    return {
      stream: function createStream () {
        return randomBytes().then(function (buf) {
          var filename = buf.toString('hex')
          stream = fs.createWriteStream(path.join(destination, filename))
          return stream
        })
      },
      event: 'close',
      finish: function storeFile () {
        var readStream = fs.createReadStream(stream.path)
        file.size = stream.bytesWritten
        file.path = stream.path
        file.stream = readStream
      }
    }
  }
}

module.exports.normalize = function normalize (handler) {
  var result, stream
  if (isStream.writable(handler)) {
    result = {
      stream: function () { return handler }
    }
  } else if (isStream.writable(handler.stream)) {
    result = handler
    stream = handler.stream
    result.stream = function () { return stream }
  } else {
    result = handler
  }
  return result
}
