'use strict'

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
    return randomBytes().then(function (buf) {
      var stream
      var filename = buf.toString('hex')
      stream = fs.createWriteStream(path.join(destination, filename))
      return {
        stream: stream,
        event: 'close',
        finish: function () {
          file.size = stream.bytesWritten
          file.path = stream.path
          file.stream = fs.createReadStream(stream.path)
        }
      }
    })
  }
}

module.exports.normalize = function normalize (handler) {
  if (isStream.writable(handler)) {
    return {stream: handler}
  }
  return handler
}
