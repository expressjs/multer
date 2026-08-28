/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var path = require('path')
var http = require('http')

var express = require('express')
var multer = require('../')
var rimraf = require('rimraf')
var temp = require('fs-temp')

// @see https://github.com/expressjs/multer/security/advisories/GHSA-qfvm-cv95-jqjf

// Count open file descriptors that point at a now-deleted file inside `dir`.
// Linux exposes these via /proc/self/fd as symlinks whose target ends with
// " (deleted)". Returns -1 when /proc/self/fd is unavailable (non-Linux).
function countLeakedFds (dir) {
  var fdDir = '/proc/self/fd'
  var entries

  try {
    entries = fs.readdirSync(fdDir)
  } catch (e) {
    return -1
  }

  var leaked = 0

  for (var i = 0; i < entries.length; i++) {
    var target

    try {
      target = fs.readlinkSync(path.join(fdDir, entries[i]))
    } catch (e) {
      continue
    }

    if (target.indexOf(dir) === 0 && / \(deleted\)$/.test(target)) {
      leaked++
    }
  }

  return leaked
}

describe('file descriptor leak on aborted uploads', function () {
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

  it('should not leak file descriptors when uploads abort mid-write', function (done) {
    this.timeout(20000)

    if (countLeakedFds(uploadDir) === -1) return this.skip()

    var attempts = 15

    function abortOnce (next) {
      var boundary = 'FdLeakBound' + Date.now() + Math.random().toString(16).slice(2)
      var preamble =
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="file"; filename="leak.bin"\r\n' +
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
        setTimeout(next, 100)
      }, 30)
    }

    var i = 0

    function loop () {
      if (i++ >= attempts) {
        // give multer's abort cleanup time to run
        setTimeout(function () {
          var leaked = countLeakedFds(uploadDir)
          assert.strictEqual(leaked, 0, 'leaked ' + leaked + ' deleted-file descriptor(s) after ' + attempts + ' aborted uploads')
          done()
        }, 500)
        return
      }

      abortOnce(loop)
    }

    loop()
  })
})
