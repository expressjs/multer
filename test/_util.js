var fs = require('fs')
var path = require('path')
var pify = require('pify')
var assert = require('assert')
var stream = require('stream')

var onFinished = pify(require('on-finished'))

exports.file = function file (name) {
  return fs.createReadStream(path.join(__dirname, 'files', name))
}

exports.fileSize = function fileSize (path) {
  return fs.statSync(path).size
}

function streamSize (stream) {
  return new Promise(function (resolve, reject) {
    var bytes = 0

    stream.on('error', reject)
    stream.on('data', function (chunk) { bytes += chunk.length })
    stream.on('end', function () { resolve(bytes) })
  })
}

exports.assertStreamSize = function assertStreamSize (stream, size) {
  return streamSize(stream).then(function (actual) {
    assert.equal(actual, size)
  })
}

function getLength (form) {
  return pify(form.getLength).call(form)
}

exports.submitForm = function submitForm (multer, form, cb) {
  return getLength(form).then(function (length) {
    var req = new stream.PassThrough()

    req.complete = false
    form.once('end', function () {
      req.complete = true
    })

    form.pipe(req)
    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      'content-length': length
    }

    return pify(multer)(req, null)
      .then(function () { return onFinished(req) })
      .then(function () { return req })
  })
}
