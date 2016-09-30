var fs = require('fs')
var path = require('path')
var pify = require('pify')
var hasha = require('hasha')
var assert = require('assert')
var stream = require('stream')

var onFinished = pify(require('on-finished'))

var fileHashes = new Map([
  ['empty', 'd41d8cd98f00b204e9800998ecf8427e'],
  ['large', 'd5554977e0b856fa5ad94fff283616fb'],
  ['medium', '239c571181de5fd47d62419e3e6adc60'],
  ['small', '3817334ffb4cf3fcaa16c4258d888131'],
  ['tiny', '300198b56f6d5f1603082c190990b5ec']
])

var fileSizes = new Map([
  ['empty', 0],
  ['large', 2413677],
  ['medium', 13196],
  ['small', 1778],
  ['tiny', 122]
])

exports.file = function file (name) {
  return fs.createReadStream(path.join(__dirname, 'files', name + '.dat'))
}

exports.assertFile = function (file, fieldName, fileName) {
  if (!fileHashes.has(fileName) || !fileSizes.has(fileName)) {
    throw new Error('No file named "' + fileName + '"')
  }

  assert.equal(file.fieldName, fieldName)
  assert.equal(file.originalName, fileName + '.dat')
  assert.equal(file.size, fileSizes.get(fileName))

  return hasha.fromStream(file.stream, { algorithm: 'md5' }).then(function (hash) {
    assert.equal(hash, fileHashes.get(fileName))
  })
}

exports.assertFiles = function (files) {
  return Promise.all(files.map(function (args) {
    return exports.assertFile(args[0], args[1], args[2])
  }))
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
