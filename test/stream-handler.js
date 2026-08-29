/* eslint-env mocha */

var assert = require('assert')
var stream = require('stream')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

// Builds a request whose body has already been consumed by the platform and
// is only available as `req.rawBody`, like Google Cloud Functions does.
function preConsumedRequest (form, cb) {
  var chunks = []

  form.on('data', function (chunk) { chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)) })
  form.on('end', function () {
    var body = Buffer.concat(chunks)
    var req = new stream.PassThrough()

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      'content-length': body.length
    }
    req.rawBody = body
    req.resume()
    req.end()
    req.on('end', function () { cb(req) })
  })
  form.resume()
}

function rawBodyHandler (req, busboy) {
  if (req.rawBody) {
    busboy.end(req.rawBody)
  } else {
    req.pipe(busboy)
  }
}

describe('Stream handler', function () {
  it('should pipe the request by default', function (done) {
    var form = new FormData()
    var parser = multer().single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.body.name, 'Multer')
      assert.strictEqual(req.file.originalname, 'small0.dat')
      done()
    })
  })

  it('should read a pre-consumed body through the stream handler', function (done) {
    var form = new FormData()
    var parser = multer({ streamHandler: rawBodyHandler }).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small0.dat'))

    preConsumedRequest(form, function (req) {
      assert.strictEqual(req.readable, false)

      parser(req, null, function (err) {
        assert.ifError(err)
        assert.strictEqual(req.body.name, 'Multer')
        assert.strictEqual(req.file.originalname, 'small0.dat')
        assert.strictEqual(req.file.size, 1778)
        done()
      })
    })
  })

  it('should apply the stream handler to .any() as well', function (done) {
    var form = new FormData()
    var parser = multer({ streamHandler: rawBodyHandler }).any()

    form.append('file', util.file('small0.dat'))

    preConsumedRequest(form, function (req) {
      parser(req, null, function (err) {
        assert.ifError(err)
        assert.strictEqual(req.files.length, 1)
        done()
      })
    })
  })

  it('should call the stream handler once with the request and busboy', function (done) {
    var calls = []
    var form = new FormData()
    var parser = multer({
      streamHandler: function (req, busboy) {
        calls.push([req, busboy])
        req.pipe(busboy)
      }
    }).none()

    form.append('name', 'Multer')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(calls.length, 1)
      assert.strictEqual(calls[0][0], req)
      assert.strictEqual(typeof calls[0][1].end, 'function')
      done()
    })
  })

  it('should report errors through next() with a pre-consumed body', function (done) {
    var form = new FormData()
    var parser = multer({ streamHandler: rawBodyHandler, limits: { fileSize: 100 } }).single('file')

    form.append('file', util.file('small0.dat'))

    preConsumedRequest(form, function (req) {
      parser(req, null, function (err) {
        assert.ok(err)
        assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')
        done()
      })
    })
  })

  it('should reject a stream handler that is not a function', function () {
    assert.throws(function () {
      multer({ streamHandler: 'nope' })
    }, /Expected streamHandler to be a function/)
  })
})
