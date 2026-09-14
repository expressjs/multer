/* eslint-env mocha */

var assert = require('assert')

var multer = require('../')
var stream = require('stream')

function submit (middleware, part, cb) {
  var req = new stream.PassThrough()
  var boundary = 'AaB03x'
  var body = [
    '--' + boundary,
    part,
    'Content-Type: text/plain',
    '',
    'test content',
    '--' + boundary + '--'
  ].join('\r\n')

  req.headers = {
    'content-type': 'multipart/form-data; boundary=' + boundary,
    'content-length': body.length
  }

  req.end(body)

  middleware(req, null, function (err) {
    if (err) return cb(err)
    cb(null, req)
  })
}

function submitFieldName (fieldname, cb) {
  submit(multer().none(), 'Content-Disposition: form-data; name="' + fieldname + '"', cb)
}

describe('Field name decoding', function () {
  it('should decode an escaped double quote (%22)', function (done) {
    submitFieldName('a%22b', function (err, req) {
      assert.ifError(err)
      assert.deepStrictEqual(Object.keys(req.body), ['a"b'])
      done()
    })
  })

  it('should decode escaped CR and LF (%0D, %0A)', function (done) {
    submitFieldName('a%0D%0Ab', function (err, req) {
      assert.ifError(err)
      assert.deepStrictEqual(Object.keys(req.body), ['a\r\nb'])
      done()
    })
  })

  it('should not alter a field name with no escapes', function (done) {
    submitFieldName('hello world', function (err, req) {
      assert.ifError(err)
      assert.deepStrictEqual(Object.keys(req.body), ['hello world'])
      done()
    })
  })

  it('should preserve a literal percent sign', function (done) {
    // `%` itself is never escaped by the WHATWG serialiser, so a name like
    // this must survive untouched -- a full decodeURIComponent would break it.
    submitFieldName('50%off', function (err, req) {
      assert.ifError(err)
      assert.deepStrictEqual(Object.keys(req.body), ['50%off'])
      done()
    })
  })

  it('should accept a file whose field name contains an escaped quote', function (done) {
    var part = 'Content-Disposition: form-data; name="a%22b"; filename="x.txt"'

    submit(multer().single('a"b'), part, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.file.fieldname, 'a"b')
      done()
    })
  })

  it('should report the decoded field name on a limit error', function (done) {
    var opts = { limits: { fieldSize: 1 } }
    var part = 'Content-Disposition: form-data; name="a%22b"'

    submit(multer(opts).none(), part, function (err) {
      assert.strictEqual(err.code, 'LIMIT_FIELD_VALUE')
      assert.strictEqual(err.field, 'a"b')
      done()
    })
  })
})
