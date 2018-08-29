/* eslint-env mocha */

var assert = require('assert')

var os = require('os')
var util = require('./_util')
var multer = require('../')
var stream = require('stream')
var FormData = require('form-data')
var crypto = require('crypto')
var fs = require('fs')
var path = require('path')
var onFinished = require('on-finished')
var inherits = require('util').inherits

function withLimits (limits, fields) {
  var storage = multer.memoryStorage()
  return multer({ storage: storage, limits: limits }).fields(fields)
}

describe('Error Handling', function () {
  it('should respect parts limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ parts: 1 }, [
      { name: 'small0', maxCount: 1 }
    ])

    form.append('field0', 'BOOM!')
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_PART_COUNT')
      done()
    })
  })

  it('should respect file size limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fileSize: 1500 }, [
      { name: 'tiny0', maxCount: 1 },
      { name: 'small0', maxCount: 1 }
    ])

    form.append('tiny0', util.file('tiny0.dat'))
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FILE_SIZE')
      assert.equal(err.field, 'small0')
      done()
    })
  })

  it('should respect file count limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ files: 1 }, [
      { name: 'small0', maxCount: 1 },
      { name: 'small1', maxCount: 1 }
    ])

    form.append('small0', util.file('small0.dat'))
    form.append('small1', util.file('small1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FILE_COUNT')
      done()
    })
  })

  it('should respect file key limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fieldNameSize: 4 }, [
      { name: 'small0', maxCount: 1 }
    ])

    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FIELD_KEY')
      done()
    })
  })

  it('should respect field key limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fieldNameSize: 4 }, [])

    form.append('ok', 'SMILE')
    form.append('blowup', 'BOOM!')

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FIELD_KEY')
      done()
    })
  })

  it('should respect field value limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fieldSize: 16 }, [])

    form.append('field0', 'This is okay')
    form.append('field1', 'This will make the parser explode')

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FIELD_VALUE')
      assert.equal(err.field, 'field1')
      done()
    })
  })

  it('should respect field count limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fields: 1 }, [])

    form.append('field0', 'BOOM!')
    form.append('field1', 'BOOM!')

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FIELD_COUNT')
      done()
    })
  })

  it('should respect fields given', function (done) {
    var form = new FormData()
    var parser = withLimits(undefined, [
      { name: 'wrongname', maxCount: 1 }
    ])

    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(err.field, 'small0')
      done()
    })
  })

  it('should report errors from storage engines', function (done) {
    var storage = multer.memoryStorage()

    storage._removeFile = function _removeFile (req, file, cb) {
      var err = new Error('Test error')
      err.code = 'TEST'
      cb(err)
    }

    var form = new FormData()
    var upload = multer({ storage: storage })
    var parser = upload.single('tiny0')

    form.append('tiny0', util.file('tiny0.dat'))
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(err.field, 'small0')

      assert.equal(err.storageErrors.length, 1)
      assert.equal(err.storageErrors[0].code, 'TEST')
      assert.equal(err.storageErrors[0].field, 'tiny0')
      assert.equal(err.storageErrors[0].file, req.file)

      done()
    })
  })

  it('should report errors from busboy constructor', function (done) {
    var req = new stream.PassThrough()
    var storage = multer.memoryStorage()
    var upload = multer({ storage: storage }).single('tiny0')
    var body = 'test'

    req.headers = {
      'content-type': 'multipart/form-data',
      'content-length': body.length
    }

    req.end(body)

    upload(req, null, function (err) {
      assert.equal(err.message, 'Multipart: Boundary not found')
      done()
    })
  })

  it('should report errors from busboy parsing', function (done) {
    var req = new stream.PassThrough()
    var storage = multer.memoryStorage()
    var upload = multer({ storage: storage }).single('tiny0')
    var boundary = 'AaB03x'
    var body = [
      '--' + boundary,
      'Content-Disposition: form-data; name="tiny0"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      'test without end boundary'
    ].join('\r\n')

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': body.length
    }

    req.end(body)

    upload(req, null, function (err) {
      assert.equal(err.message, 'Unexpected end of multipart data')
      done()
    })
  })

  it('should gracefully handle more than one error at a time', function (done) {
    var form = new FormData()
    var storage = multer.diskStorage({ destination: os.tmpdir() })
    var upload = multer({ storage: storage, limits: { fileSize: 1, files: 1 } }).fields([
      { name: 'small0', maxCount: 1 }
    ])

    form.append('small0', util.file('small0.dat'))
    form.append('small0', util.file('small0.dat'))

    util.submitForm(upload, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FILE_SIZE')
      done()
    })
  })

  it('should handle clients aborting the request and clean up temporary files', function (done) {
    function AbortDuringPassThrough (maxBytes) {
      stream.PassThrough.call(this)

      this.bytesPassed = 0
      this.maxBytes = maxBytes
    }

    inherits(AbortDuringPassThrough, stream.PassThrough)

    AbortDuringPassThrough.prototype._transform = function (chunk, enc, cb) {
      if (this.bytesPassed + chunk.length < this.maxBytes) {
        this.bytesPassed += chunk.length
        stream.PassThrough.prototype._transform(chunk, enc, cb)
      } else {
        var len = this.maxBytes - this.bytesPassed
        if (len) {
          this.bytesPassed += len
          stream.PassThrough.prototype._transform(chunk.slice(0, len), enc, cb)

          this.emit('aborted')
        } else {
          cb()
        }
      }
    }

    var destination = os.tmpdir()
    var filename = crypto.pseudoRandomBytes(16).toString('hex')

    var storage = multer.diskStorage({
      destination: destination,
      filename: function (req, file, cb) { cb(null, filename) }
    })
    var upload = multer({ storage: storage }).single('file')

    var form = new FormData()
    form.append('file', util.file('small0.dat'))

    form.getLength(function (err, length) {
      assert.equal(err, null)

      var req = new AbortDuringPassThrough(1000)

      req.complete = false
      form.once('end', function () {
        req.complete = true
      })

      form.pipe(req)
      req.headers = {
        'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
        'content-length': length
      }

      upload(req, null, function (err) {
        assert.equal(err.code, 'CLIENT_ABORTED')

        onFinished(req, function () {
          assert.equal(fs.existsSync(path.join(destination, filename)), false,
                       'temporary file must be cleaned up')
          done()
        })
      })
    })
  })
})
