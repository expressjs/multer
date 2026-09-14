/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var http = require('http')
var crypto = require('crypto')

var express = require('express')
var multer = require('../')
var rimraf = require('rimraf')
var temp = require('fs-temp')

// @see https://github.com/expressjs/multer/security/advisories/GHSA-3pph-fpjx-jg34
//
// DiskStorage assigns file.path only after getFilename resolves, which is async
// by default. If a request is aborted after the multipart part has closed (so
// busboy has released the file stream and does not destroy it) but before the
// engine has assigned file.path, the abort cleanup does not yet see the file,
// then the engine finishes and writes a complete file that nothing removes. An
// async filename() widens that window so the race is deterministic.
describe('orphan file cleanup when the abort lands before the engine assigns a path', function () {
  var uploadDir, server, port

  function asyncFilenameStorage (dir) {
    return multer.diskStorage({
      destination: dir,
      filename: function (req, file, cb) {
        // Defer path assignment, the common async filename() shape (DB / uuid
        // lookup). The abort below lands inside this window.
        setTimeout(function () {
          crypto.randomBytes(16, function (err, raw) {
            cb(err, err ? undefined : raw.toString('hex'))
          })
        }, 200)
      }
    })
  }

  beforeEach(function (done) {
    temp.mkdir(function (err, dir) {
      if (err) return done(err)

      uploadDir = dir
      var upload = multer({ storage: asyncFilenameStorage(dir) })
      var app = express()

      app.post('/upload', upload.single('file'), function (req, res) {
        res.json({ success: true, path: req.file && req.file.path })
      })

      app.use(function (err, req, res, next) {
        // The only cleanup an application can write; it removes nothing here
        // because req.file is undefined when next(err) runs.
        if (req.file && req.file.path) {
          try { fs.unlinkSync(req.file.path) } catch (e) {}
        }
        res.status(400).json({ error: err.message || err.code })
      })

      server = app.listen(0, function () {
        port = server.address().port
        done()
      })
    })
  })

  afterEach(function (done) {
    server.close(function () {
      rimraf(uploadDir, done)
    })
  })

  it('should not orphan a file when the abort lands before the engine names it', function (done) {
    this.timeout(5000)

    var boundary = 'BeforePathBound' + Date.now()
    var preamble =
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="x.bin"\r\n' +
      'Content-Type: application/octet-stream\r\n\r\n'
    var chunk = Buffer.alloc(4096, 0x41)
    // Close the file part by starting the next part, so busboy finishes the file
    // stream (it is not destroyed on abort).
    var closePart =
      '\r\n--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="next"\r\n\r\n'

    var req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        // never satisfied, so the request stays incomplete until the abort
        'Content-Length': Buffer.byteLength(preamble) + chunk.length + Buffer.byteLength(closePart) + 1024
      }
    })

    req.on('error', function () {})
    req.write(preamble)
    req.write(chunk)
    req.write(closePart)

    // Abort at 60ms: after busboy has parsed and closed the part, well before
    // the 200ms async filename resolves and the engine writes the file.
    setTimeout(function () {
      req.destroy()

      setTimeout(function () {
        var files = fs.readdirSync(uploadDir)
        assert.strictEqual(files.length, 0, 'orphan file after abort before path assignment: ' + files.join(', '))
        done()
      }, 700)
    }, 60)
  })

  it('should keep the file and populate req.file for a complete request with an async filename', function (done) {
    this.timeout(5000)

    var boundary = 'CompleteBound' + Date.now()
    var body = Buffer.concat([
      Buffer.from(
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="file"; filename="ok.bin"\r\n' +
        'Content-Type: application/octet-stream\r\n\r\n'
      ),
      Buffer.alloc(4096, 0x42),
      Buffer.from('\r\n--' + boundary + '--\r\n')
    ])

    var req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length
      }
    }, function (res) {
      var chunks = []
      res.on('data', function (d) { chunks.push(d) })
      res.on('end', function () {
        var payload = JSON.parse(Buffer.concat(chunks).toString())
        assert.strictEqual(res.statusCode, 200)
        assert.ok(payload.success)
        assert.ok(payload.path, 'req.file.path should be populated')
        var files = fs.readdirSync(uploadDir)
        assert.strictEqual(files.length, 1, 'the completed file should be kept: ' + files.join(', '))
        done()
      })
    })

    req.on('error', done)
    req.end(body)
  })
})

// A non-abort failure (e.g. a limit violation) puts the request in the
// errorOccured state while finishAbort is still queued on pending writes. A
// file whose slow engine completes in that window must be cleaned through
// finishAbort's removeUploadedFiles so its removal error is reported via
// err.storageErrors, not removed out of band with the error dropped.
describe('storage removal errors on a non-abort failure with a slow engine', function () {
  it('should surface _removeFile errors via err.storageErrors when a limit aborts a slow upload', function (done) {
    this.timeout(5000)

    var storage = {
      _handleFile: function (req, file, cb) {
        file.stream.resume()
        setTimeout(function () {
          cb(null, { path: '/tmp/multer-3pph-test-' + Date.now() })
        }, 150)
      },
      _removeFile: function (req, file, cb) {
        process.nextTick(function () { cb(new Error('remove failed')) })
      }
    }

    var upload = multer({ storage: storage, limits: { fields: 0 } })
    var app = express()
    var captured = null

    app.post('/upload', upload.fields([{ name: 'file' }]), function (req, res) {
      res.json({ success: true })
    })
    app.use(function (err, req, res, next) {
      captured = err
      res.status(400).json({ error: err.message || err.code })
    })

    var boundary = 'LimitBound' + Date.now()
    var body =
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="a.bin"\r\n' +
      'Content-Type: application/octet-stream\r\n\r\n' +
      'DATA\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="field1"\r\n\r\n' +
      'value\r\n' +
      '--' + boundary + '--\r\n'

    var server = app.listen(0, function () {
      var port = server.address().port

      var req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/upload',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
          'Content-Length': Buffer.byteLength(body)
        }
      }, function (res) {
        res.resume()
        res.on('end', function () {
          setTimeout(function () {
            server.close(function () {
              assert.ok(captured, 'expected an upload error')
              assert.ok(
                captured.storageErrors && captured.storageErrors.length >= 1,
                'the _removeFile failure should be reported via err.storageErrors'
              )
              done()
            })
          }, 300)
        })
      })

      req.on('error', done)
      req.end(body)
    })
  })
})

// A file that already had a path when the abort ran is removed by finishAbort.
// If its engine then completes successfully, the late-completion branch must not
// remove it a second time (engines are not required to support double removal).
describe('cleanup of an aborted upload whose engine assigned a path early', function () {
  it('should not remove the same file twice when it had a path before the abort', function (done) {
    this.timeout(5000)

    var removeCount = 0
    var storage = {
      _handleFile: function (req, file, cb) {
        file.stream.resume()
        // Assign the path before completing, as DiskStorage does, then complete
        // successfully after the abort has already run.
        file.path = '/tmp/multer-3pph-early-' + Date.now()
        setTimeout(function () { cb(null, { path: file.path }) }, 150)
      },
      _removeFile: function (req, file, cb) {
        removeCount++
        process.nextTick(cb)
      }
    }

    var upload = multer({ storage: storage })
    var app = express()

    app.post('/upload', upload.single('file'), function (req, res) {
      res.json({ ok: true })
    })
    app.use(function (err, req, res, next) {
      res.status(400).json({ error: err.message || err.code })
    })

    var server = app.listen(0, function () {
      var port = server.address().port
      var boundary = 'EarlyPathBound' + Date.now()
      var preamble =
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="file"; filename="a.bin"\r\n' +
        'Content-Type: application/octet-stream\r\n\r\n'
      var chunk = Buffer.alloc(4096, 0x41)
      var closePart =
        '\r\n--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="next"\r\n\r\n'

      var req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/upload',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
          'Content-Length': Buffer.byteLength(preamble) + chunk.length + Buffer.byteLength(closePart) + 1024
        }
      })

      req.on('error', function () {})
      req.write(preamble)
      req.write(chunk)
      req.write(closePart)

      setTimeout(function () {
        req.destroy()

        setTimeout(function () {
          server.close(function () {
            assert.strictEqual(removeCount, 1, 'file should be removed exactly once, got ' + removeCount)
            done()
          })
        }, 400)
      }, 60)
    })
  })
})
