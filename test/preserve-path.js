/* eslint-env mocha */

var assert = require('assert')
var stream = require('stream')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

function submitFile (parser, filepath, cb) {
  var form = new FormData()

  form.append('file', util.file('tiny0.dat'), { filepath: filepath })

  util.submitForm(parser, form, cb)
}

// Issue #1244 used SuperAgent/supertest `.attach({ filename })`, which
// form-data basenames before the body is sent. A hand-built part is the only
// way to put a path on the wire and assert what Multer does with it.
function submitRawFilename (parser, fieldname, filename, cb) {
  var boundary = 'AaB03x'
  var body = [
    '--' + boundary,
    'Content-Disposition: form-data; name="' + fieldname + '"; filename="' + filename + '"',
    'Content-Type: text/plain',
    '',
    'hello',
    '--' + boundary + '--',
    ''
  ].join('\r\n')

  var req = new stream.PassThrough()

  req.headers = {
    'content-type': 'multipart/form-data; boundary=' + boundary,
    'content-length': Buffer.byteLength(body)
  }
  req.end(body)

  parser(req, null, function (err) {
    cb(err, req)
  })
}

describe('Preserve Path', function () {
  it('should strip the path by default', function (done) {
    submitFile(multer().single('file'), 'a/b/c.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.file.fieldname, 'file')
      assert.strictEqual(req.file.originalname, 'c.txt')

      done()
    })
  })

  it('should keep the full path when enabled', function (done) {
    var parser = multer({ preservePath: true }).single('file')

    submitFile(parser, 'a/b/c.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.file.fieldname, 'file')
      assert.strictEqual(req.file.originalname, 'a/b/c.txt')

      done()
    })
  })

  // #1244: memoryStorage + array(), filename="/some/path/a.txt"
  it('should keep an absolute unix path on array() when enabled', function (done) {
    var parser = multer({ storage: multer.memoryStorage(), preservePath: true }).array('files')

    submitRawFilename(parser, 'files', '/some/path/a.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files.length, 1)
      assert.strictEqual(req.files[0].fieldname, 'files')
      assert.strictEqual(req.files[0].originalname, '/some/path/a.txt')

      done()
    })
  })

  it('should strip an absolute unix path on array() by default', function (done) {
    var parser = multer({ storage: multer.memoryStorage() }).array('files')

    submitRawFilename(parser, 'files', '/some/path/a.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files[0].originalname, 'a.txt')

      done()
    })
  })

  it('should keep a windows path when enabled', function (done) {
    var parser = multer({ storage: multer.memoryStorage(), preservePath: true }).array('files')

    submitRawFilename(parser, 'files', 'C:\\some\\path\\a.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files[0].originalname, 'C:\\some\\path\\a.txt')

      done()
    })
  })

  it('should strip a windows path by default', function (done) {
    var parser = multer({ storage: multer.memoryStorage() }).array('files')

    submitRawFilename(parser, 'files', 'C:\\some\\path\\a.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files[0].originalname, 'a.txt')

      done()
    })
  })
})
