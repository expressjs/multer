/* eslint-env mocha */

var assert = require('assert')
var stream = require('stream')

var multer = require('../')

// Multipart body with one text field whose value is "åäö" encoded as latin1
// (bytes e5 e4 f6) and no charset declared for the part.
function latin1FieldRequest () {
  var boundary = 'AaB03x'
  var body = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="name"\r\n\r\n'),
    Buffer.from([0xe5, 0xe4, 0xf6]),
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ])
  var req = new stream.PassThrough()

  req.headers = {
    'content-type': 'multipart/form-data; boundary=' + boundary,
    'content-length': body.length
  }
  req.end(body)

  return req
}

function fileRequest () {
  var boundary = 'AaB03x'
  var body = [
    '--' + boundary,
    'Content-Disposition: form-data; name="file"; filename="a.txt"',
    'Content-Type: text/plain',
    '',
    'file content',
    '--' + boundary + '--',
    ''
  ].join('\r\n')
  var req = new stream.PassThrough()

  req.headers = {
    'content-type': 'multipart/form-data; boundary=' + boundary,
    'content-length': body.length
  }
  req.end(body)

  return req
}

// Storage engine that records the file stream's highWaterMark.
function recordingStorage (record) {
  return {
    _handleFile: function (req, file, cb) {
      record.readableHighWaterMark = file.stream.readableHighWaterMark
      file.stream.resume()
      file.stream.on('end', function () { cb(null, {}) })
    },
    _removeFile: function (req, file, cb) { cb(null) }
  }
}

describe('busboy options', function () {
  it('should decode text fields as utf8 by default', function (done) {
    var upload = multer()
    var req = latin1FieldRequest()

    upload.none()(req, null, function (err) {
      assert.ifError(err)
      // latin1 bytes are not valid utf8, so the value is decoded with replacement characters
      assert.notStrictEqual(req.body.name, 'åäö')
      assert.ok(req.body.name.indexOf('\ufffd') !== -1)
      done()
    })
  })

  it('should decode text fields with the given defCharset', function (done) {
    var upload = multer({ defCharset: 'latin1' })
    var req = latin1FieldRequest()

    upload.none()(req, null, function (err) {
      assert.ifError(err)
      assert.strictEqual(req.body.name, 'åäö')
      done()
    })
  })

  it('should apply defCharset to .any() as well', function (done) {
    var upload = multer({ defCharset: 'latin1' })
    var req = latin1FieldRequest()

    upload.any()(req, null, function (err) {
      assert.ifError(err)
      assert.strictEqual(req.body.name, 'åäö')
      done()
    })
  })

  it('should keep the default file stream highWaterMark when fileHwm is not set', function (done) {
    var record = {}
    var upload = multer({ storage: recordingStorage(record) })

    upload.single('file')(fileRequest(), null, function (err) {
      assert.ifError(err)
      assert.strictEqual(record.readableHighWaterMark, new stream.Readable().readableHighWaterMark)
      done()
    })
  })

  it('should pass fileHwm to the file streams', function (done) {
    var record = {}
    var upload = multer({ storage: recordingStorage(record), fileHwm: 1024 })

    upload.single('file')(fileRequest(), null, function (err) {
      assert.ifError(err)
      assert.strictEqual(record.readableHighWaterMark, 1024)
      done()
    })
  })

  it('should accept highWaterMark for the parser stream', function (done) {
    var record = {}
    var upload = multer({ storage: recordingStorage(record), highWaterMark: 1024 })
    var req = fileRequest()

    upload.single('file')(req, null, function (err) {
      assert.ifError(err)
      assert.strictEqual(req.file.originalname, 'a.txt')
      done()
    })
  })
})
