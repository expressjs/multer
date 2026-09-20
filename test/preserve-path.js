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

// Build a multipart body with the filename parameter exactly as it would
// appear on the wire. form-data's `filename` option runs path.basename first
// (see #1244), so it cannot express the paths this option exists to keep.
function submitRawFilename (parser, fieldname, filename, cb) {
  var boundary = '----MulterPreservePath'
  var body = [
    '--' + boundary,
    'Content-Disposition: form-data; name="' + fieldname + '"; filename="' + filename + '"',
    'Content-Type: text/plain',
    '',
    'file-contents',
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

  // https://github.com/expressjs/multer/issues/1244
  it('should keep an absolute posix path on the wire when enabled', function (done) {
    var parser = multer({
      storage: multer.memoryStorage(),
      preservePath: true
    }).array('files')

    submitRawFilename(parser, 'files', '/some/path/a.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files.length, 1)
      assert.strictEqual(req.files[0].fieldname, 'files')
      assert.strictEqual(req.files[0].originalname, '/some/path/a.txt')
      assert.ok(Buffer.isBuffer(req.files[0].buffer))

      done()
    })
  })

  it('should strip an absolute posix path by default', function (done) {
    var parser = multer({ storage: multer.memoryStorage() }).array('files')

    submitRawFilename(parser, 'files', '/some/path/a.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files[0].originalname, 'a.txt')

      done()
    })
  })

  it('should keep a windows path on the wire when enabled', function (done) {
    var parser = multer({ preservePath: true }).single('file')

    submitRawFilename(parser, 'file', 'C:\\some\\path\\a.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.file.originalname, 'C:\\some\\path\\a.txt')

      done()
    })
  })

  it('should keep the path on .any() when enabled', function (done) {
    var parser = multer({ preservePath: true }).any()

    submitRawFilename(parser, 'files', '/some/path/a.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files[0].originalname, '/some/path/a.txt')

      done()
    })
  })

  it('cannot recover a path that form-data already stripped from filename', function (done) {
    var form = new FormData()
    var parser = multer({
      storage: multer.memoryStorage(),
      preservePath: true
    }).array('files')

    // Same shape as #1244 (Buffer + filename). form-data basenames this
    // before the body is sent, so multer only ever sees "a.txt".
    form.append('files', Buffer.from('hello'), { filename: '/some/path/a.txt' })

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files[0].originalname, 'a.txt')

      done()
    })
  })
})
