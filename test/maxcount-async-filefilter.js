/* eslint-env mocha */

var assert = require('assert')
var stream = require('stream')

var multer = require('../')

// The whole multipart body is delivered in a single write so busboy emits every
// file event synchronously in one _write(), the timing under which an async
// fileFilter can let files slip past a field's maxCount.

var BOUNDARY = '----MulterMaxCountBoundary'

function buildBody (field, count) {
  var parts = []

  for (var i = 0; i < count; i++) {
    parts.push(
      '--' + BOUNDARY + '\r\n' +
      'Content-Disposition: form-data; name="' + field + '"; filename="f' + i + '.txt"\r\n' +
      'Content-Type: text/plain\r\n\r\n' +
      'data\r\n'
    )
  }

  parts.push('--' + BOUNDARY + '--\r\n')

  return Buffer.from(parts.join(''))
}

function submitRaw (parser, body, cb) {
  var req = new stream.PassThrough()

  req.headers = {
    'content-type': 'multipart/form-data; boundary=' + BOUNDARY,
    'content-length': String(body.length)
  }

  parser(req, null, function (err) { cb(err, req) })

  // Deliver the entire body in a single write so busboy emits every file event
  // synchronously in one _write().
  req.end(body)
}

function asyncAllow (req, file, cb) {
  setImmediate(function () { cb(null, true) })
}

describe('maxCount enforcement with an async fileFilter', function () {
  it('should reject files past maxCount when the fileFilter defers its callback', function (done) {
    var parser = multer({
      storage: multer.memoryStorage(),
      fileFilter: asyncAllow
    }).array('docs', 2)

    submitRaw(parser, buildBody('docs', 10), function (err, req) {
      assert.ok(err, 'expected a LIMIT_UNEXPECTED_FILE error')
      assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      done()
    })
  })

  it('should reject a second file for .single() when the fileFilter defers its callback', function (done) {
    var parser = multer({
      storage: multer.memoryStorage(),
      fileFilter: asyncAllow
    }).single('doc')

    submitRaw(parser, buildBody('doc', 2), function (err, req) {
      assert.ok(err, 'expected a LIMIT_UNEXPECTED_FILE error')
      assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      done()
    })
  })

  it('should accept exactly maxCount files with an async fileFilter', function (done) {
    var parser = multer({
      storage: multer.memoryStorage(),
      fileFilter: asyncAllow
    }).array('docs', 2)

    submitRaw(parser, buildBody('docs', 2), function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.files.length, 2)
      done()
    })
  })

  it('should not leak a maxCount slot when the fileFilter rejects a file more than once', function (done) {
    // A filter that rejects the first file twice must release only the one slot
    // it reserved, otherwise the extra release lets later files past maxCount.
    var calls = 0
    var parser = multer({
      storage: multer.memoryStorage(),
      fileFilter: function (req, file, cb) {
        calls += 1
        if (calls === 1) {
          cb(null, false)
          cb(null, false)
        } else {
          cb(null, true)
        }
      }
    }).array('docs', 1)

    submitRaw(parser, buildBody('docs', 3), function (err, req) {
      assert.ok(err, 'expected LIMIT_UNEXPECTED_FILE; a double reject must not free extra slots')
      assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      done()
    })
  })
})
