/* eslint-env mocha */

var assert = require('assert')

var multer = require('../')
var stream = require('stream')

function submitFilename (filename, cb) {
  var req = new stream.PassThrough()
  var boundary = 'AaB03x'
  var body = [
    '--' + boundary,
    'Content-Disposition: form-data; name="file"; filename="' + filename + '"',
    'Content-Type: text/plain',
    '',
    'test file content',
    '--' + boundary + '--'
  ].join('\r\n')

  req.headers = {
    'content-type': 'multipart/form-data; boundary=' + boundary,
    'content-length': body.length
  }

  req.end(body)

  multer().single('file')(req, null, function (err) {
    if (err) return cb(err)
    cb(null, req.file)
  })
}

describe('Filename decoding', function () {
  it('should decode an escaped double quote (%22)', function (done) {
    submitFilename('file%22.ext', function (err, file) {
      assert.ifError(err)
      assert.strictEqual(file.originalname, 'file".ext')
      done()
    })
  })

  it('should decode escaped CR and LF (%0D, %0A)', function (done) {
    submitFilename('a%0D%0Ab.ext', function (err, file) {
      assert.ifError(err)
      assert.strictEqual(file.originalname, 'a\r\nb.ext')
      done()
    })
  })

  it('should not alter a filename with no escapes', function (done) {
    submitFilename('hello world.ext', function (err, file) {
      assert.ifError(err)
      assert.strictEqual(file.originalname, 'hello world.ext')
      done()
    })
  })

  it('should preserve a literal percent sign', function (done) {
    // `%` itself is never escaped by the WHATWG serialiser, so a name like
    // this must survive untouched -- a full decodeURIComponent would break it.
    submitFilename('50%off.ext', function (err, file) {
      assert.ifError(err)
      assert.strictEqual(file.originalname, '50%off.ext')
      done()
    })
  })
})
