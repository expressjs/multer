/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var http = require('http')

var express = require('express')
var multer = require('../')
var rimraf = require('rimraf')
var temp = require('fs-temp')

// @see https://github.com/expressjs/multer/security/advisories/GHSA-3p4h-7m6x-2hcm

// File cleanup after an abort is inherently asynchronous and its timing varies
// per platform: on Windows with older Node.js versions the cleanup can take
// longer than a fixed delay, which made this suite flaky (GHSA-3p4h-7m6x-2hcm
// regression test). Poll until the directory is empty instead of assuming the
// cleanup finished within a hard-coded number of milliseconds.
function waitForEmptyDir (dir, message, done) {
  var deadline = Date.now() + 4000

  function poll () {
    var files = fs.readdirSync(dir)

    if (files.length === 0) {
      return done()
    }

    if (Date.now() >= deadline) {
      return assert.strictEqual(files.length, 0, message + ': ' + files.join(', '))
    }

    setTimeout(poll, 50)
  }

  poll()
}

describe('orphan file cleanup on abort/malformed requests', function () {
  var uploadDir, server, port

  beforeEach(function (done) {
    temp.mkdir(function (err, dir) {
      if (err) return done(err)

      uploadDir = dir
      var upload = multer({ dest: dir })
      var app = express()

      app.post('/upload', upload.single('file'), function (req, res) {
        res.json({ success: true })
      })

      app.post('/upload-multi', upload.array('file', 2), function (req, res) {
        res.json({ success: true })
      })

      app.use(function (err, req, res, next) {
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

  it('should not leave orphan files when client aborts mid-upload', function (done) {
    this.timeout(10000)

    var boundary = 'AbortBound' + Date.now()
    var preamble =
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="test.bin"\r\n' +
      'Content-Type: application/octet-stream\r\n\r\n'
    var chunk = Buffer.alloc(64 * 1024, 0x5a)

    var req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': Buffer.byteLength(preamble) + (chunk.length * 10)
      }
    })

    req.on('error', function () {})
    req.write(preamble)
    req.write(chunk)

    setTimeout(function () {
      req.destroy()

      waitForEmptyDir(uploadDir, 'orphan files after client abort', done)
    }, 50)
  })

  it('should not leave orphan files on truncated multipart', function (done) {
    this.timeout(10000)

    var boundary = 'TruncBound' + Date.now()
    var body =
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="test.bin"\r\n' +
      'Content-Type: application/octet-stream\r\n\r\n' +
      'ORPHAN FILE DATA'

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
        waitForEmptyDir(uploadDir, 'orphan files after truncated multipart', done)
      })
    })

    req.on('error', function () {})
    req.write(body)
    req.end()
  })

  it('should not leave orphan files when a later file aborts after an earlier one completed', function (done) {
    this.timeout(10000)

    var boundary = 'CompletedBound' + Date.now()

    var partA =
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="done.bin"\r\n' +
      'Content-Type: application/octet-stream\r\n\r\n' +
      'COMPLETED FILE CONTENT\r\n'

    var partBStart =
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="aborted.bin"\r\n' +
      'Content-Type: application/octet-stream\r\n\r\n'

    var chunkB = Buffer.alloc(64 * 1024, 0x5a)

    var req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/upload-multi',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': Buffer.byteLength(partA) + Buffer.byteLength(partBStart) + (chunkB.length * 10)
      }
    })

    req.on('error', function () {})

    req.write(partA)
    req.write(partBStart)
    req.write(chunkB)

    setTimeout(function () {
      req.destroy()

      waitForEmptyDir(uploadDir, 'orphan files after late abort', done)
    }, 200)
  })
})
