/* eslint-env mocha */

var assert = require('assert')

var os = require('os')
var util = require('./_util')
var multer = require('../')
var removeUploadedFiles = require('../lib/remove-uploaded-files')
var stream = require('stream')
var FormData = require('form-data')
var http = require('http')
var net = require('net')

function withLimits (limits, fields) {
  var storage = multer.memoryStorage()
  return multer({ storage: storage, limits: limits }).fields(fields)
}

describe('Error Handling', function () {
  it('should be an instance of both `Error` and `MulterError` classes in case of the Multer\'s error', function (done) {
    var form = new FormData()
    var storage = multer.diskStorage({ destination: os.tmpdir() })
    var upload = multer({ storage: storage }).fields([
      { name: 'small0', maxCount: 1 }
    ])

    form.append('small0', util.file('small0.dat'))
    form.append('small0', util.file('small0.dat'))

    util.submitForm(upload, form, function (err, req) {
      assert.strictEqual(err instanceof Error, true)
      assert.strictEqual(err instanceof multer.MulterError, true)
      done()
    })
  })

  it('should respect parts limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ parts: 1 }, [
      { name: 'small0', maxCount: 1 }
    ])

    form.append('field0', 'BOOM!')
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.strictEqual(err.code, 'LIMIT_PART_COUNT')
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
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')
      assert.strictEqual(err.field, 'small0')
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
      assert.strictEqual(err.code, 'LIMIT_FILE_COUNT')
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
      assert.strictEqual(err.code, 'LIMIT_FIELD_KEY')
      done()
    })
  })

  it('should respect field key limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fieldNameSize: 4 }, [])

    form.append('ok', 'SMILE')
    form.append('blowup', 'BOOM!')

    util.submitForm(parser, form, function (err, req) {
      assert.strictEqual(err.code, 'LIMIT_FIELD_KEY')
      done()
    })
  })

  it('should respect field value limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fieldSize: 16 }, [])

    form.append('field0', 'This is okay')
    form.append('field1', 'This will make the parser explode')

    util.submitForm(parser, form, function (err, req) {
      assert.strictEqual(err.code, 'LIMIT_FIELD_VALUE')
      assert.strictEqual(err.field, 'field1')
      done()
    })
  })

  it('should respect field count limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fields: 1 }, [])

    form.append('field0', 'BOOM!')
    form.append('field1', 'BOOM!')

    util.submitForm(parser, form, function (err, req) {
      assert.strictEqual(err.code, 'LIMIT_FIELD_COUNT')
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
      assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.strictEqual(err.field, 'small0')
      done()
    })
  })

  it('should notify of missing field name', function (done) {
    var req = new stream.PassThrough()
    var storage = multer.memoryStorage()
    var upload = multer({ storage: storage }).single('tiny0')
    var boundary = 'AaB03x'
    var body = [
      '--' + boundary,
      'Content-Disposition: form-data',
      '',
      'test content',
      '--' + boundary,
      ''
    ].join('\r\n')

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': body.length
    }

    req.end(body)

    upload(req, null, function (err) {
      assert.strictEqual(err.code, 'MISSING_FIELD_NAME')
      done()
    })
  })

  it('should notify of missing field name', function (done) {
    var form = new FormData()
    var storage = multer.memoryStorage()
    var parser = multer({ storage: storage }).single('small0')

    form.append('', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.strictEqual(err.code, 'MISSING_FIELD_NAME')
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
      assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.strictEqual(err.field, 'small0')

      assert.strictEqual(err.storageErrors.length, 1)
      assert.strictEqual(err.storageErrors[0].code, 'TEST')
      assert.strictEqual(err.storageErrors[0].field, 'tiny0')
      assert.strictEqual(err.storageErrors[0].file, req.file)

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
      assert.strictEqual(err.message, 'Multipart: Boundary not found')
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
      assert.strictEqual(err.message, 'Unexpected end of form')
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
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')
      done()
    })
  })

  it('should allow client to finish sending body before error response', function (done) {
    this.timeout(10000)

    var upload = multer({ storage: multer.memoryStorage() }).single('expected')

    var server = http.createServer(function (req, res) {
      upload(req, res, function (err) {
        res.statusCode = err ? 500 : 200
        res.end(err ? err.code : 'OK')
      })
    })

    server.listen(0, function () {
      var port = server.address().port
      var boundary = 'Drain' + Date.now()
      var preamble = [
        '--' + boundary,
        'Content-Disposition: form-data; name="unexpected"; filename="test.bin"',
        'Content-Type: application/octet-stream',
        '',
        ''
      ].join('\r\n')
      var footer = '\r\n--' + boundary + '--\r\n'
      var chunk = Buffer.alloc(32 * 1024, 97)
      var totalChunks = 24
      var contentLength = Buffer.byteLength(preamble) +
        (chunk.length * totalChunks) +
        Buffer.byteLength(footer)

      var sock = new net.Socket()
      var socketError = null
      var response = ''
      var sentChunks = 0
      var finished = false
      var timeout = setTimeout(function () {
        if (finished) return
        finished = true
        sock.destroy()
        server.close(function () {
          done(new Error('timed out while uploading request body'))
        })
      }, 8000)

      function finish (err) {
        if (finished) return
        finished = true
        clearTimeout(timeout)
        server.close(function () {
          done(err)
        })
      }

      function writeChunk () {
        if (sentChunks >= totalChunks) {
          sock.write(footer)
          return
        }

        sentChunks += 1
        var canContinue = sock.write(chunk)

        if (canContinue) {
          setTimeout(writeChunk, 2)
        } else {
          sock.once('drain', function () {
            setTimeout(writeChunk, 2)
          })
        }
      }

      sock.connect(port, '127.0.0.1', function () {
        sock.write(
          'POST / HTTP/1.1\r\n' +
          'Host: localhost\r\n' +
          'Connection: close\r\n' +
          'Content-Type: multipart/form-data; boundary=' + boundary + '\r\n' +
          'Content-Length: ' + contentLength + '\r\n\r\n'
        )
        sock.write(preamble)
        writeChunk()
      })

      sock.on('data', function (buf) {
        response += buf.toString('utf8')
      })

      sock.on('error', function (err) {
        socketError = err
      })

      sock.on('close', function () {
        if (socketError) return finish(socketError)

        try {
          assert.strictEqual(sentChunks, totalChunks)
          assert.ok(/HTTP\/1\.1 500/.test(response))
          finish()
        } catch (err) {
          finish(err)
        }
      })
    })
  })

  it('should not hang when client aborts multipart upload', function (done) {
    this.timeout(5000)

    var upload = multer({ storage: multer.memoryStorage() }).any()

    var server = http.createServer(function (req, res) {
      var hung = false

      var timer = setTimeout(function () {
        hung = true
        server.close()
        done(new Error('Middleware hung when client aborted request'))
      }, 1000)

      upload(req, res, function (/* err */) {
        if (hung) return
        clearTimeout(timer)
        server.close()
        done()
      })
    })

    server.listen(0, function () {
      var port = server.address().port
      var boundary = 'PoC' + Date.now()
      var sock = new net.Socket()

      sock.connect(port, '127.0.0.1', function () {
        sock.write(
          'POST / HTTP/1.1\r\n' +
          'Host: localhost\r\n' +
          'Content-Type: multipart/form-data; boundary=' + boundary + '\r\n' +
          'Content-Length: 999999\r\n\r\n' +
          '--' + boundary + '\r\n' +
          'Content-Disposition: form-data; name="file"; filename="test.bin"\r\n' +
          'Content-Type: application/octet-stream\r\n\r\n' +
          'AAAAAAAAAAAAAAAA'
        )

        setTimeout(function () {
          sock.destroy()
        }, 50)
      })

      sock.on('error', function () {})
    })
  })

  it('should not overflow call stack when cleaning up many files (memory storage sync remove)', function (done) {
    // - without setImmediate in remove-uploaded-files, synchronous _removeFile (e.g. memory storage)
    //     causes handleFile(0) -> remove -> cb() -> handleFile(1) -> ... in one stack,
    //     leading to "Maximum call stack size exceeded"
    // - use enough files to exceed typical node stack depth (~10k - 30k)

    this.timeout(10 * 1000)

    var fileCount = 25000
    var uploadedFiles = []

    for (var i = 0; i < fileCount; i++) {
      uploadedFiles.push({ fieldname: 'file', originalname: 'f.dat', buffer: Buffer.alloc(0) })
    }

    function syncRemove (file, cb) {
      delete file.buffer
      cb(null)
    }

    removeUploadedFiles(uploadedFiles, syncRemove, function (err, errors) {
      assert.ifError(err)
      assert.strictEqual(errors.length, 0)
      done()
    })
  })

  it('should throw TypeError when fileSize limit is a float', function () {
    assert.throws(function () {
      multer({ limits: { fileSize: 1024.5 } })
    }, TypeError)
  })

  it('should accept integer fileSize limit', function () {
    assert.doesNotThrow(function () {
      multer({ limits: { fileSize: 1024 } })
    })
  })
})
