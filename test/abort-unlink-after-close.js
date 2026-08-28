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
//
// Windows (before Node.js 22) refuses to unlink a file that is still open, so
// the abort cleanup must close the disk write stream before removing the
// partial file. Emulate that rule on Linux: while the test runs, fs.unlink
// fails with EPERM whenever this process still holds the target open (checked
// through /proc/self/fd). Skipped where /proc/self/fd is unavailable.

function isOpenByThisProcess (target) {
  var fdDir = '/proc/self/fd'
  var entries

  try {
    entries = fs.readdirSync(fdDir)
  } catch (e) {
    return false
  }

  var resolved = path.resolve(target)

  for (var i = 0; i < entries.length; i++) {
    try {
      if (fs.readlinkSync(path.join(fdDir, entries[i])) === resolved) return true
    } catch (e) {
      continue
    }
  }

  return false
}

var hasProcFd = fs.existsSync('/proc/self/fd')
var describeOnLinux = hasProcFd ? describe : describe.skip

describeOnLinux('unlink after close on aborted uploads', function () {
  var uploadDir, server, port
  var realUnlink = fs.unlink

  beforeEach(function (done) {
    fs.unlink = function (target, cb) {
      if (isOpenByThisProcess(target)) {
        var err = new Error('EPERM: operation not permitted, unlink (file is open)')
        err.code = 'EPERM'
        return process.nextTick(cb, err)
      }
      return realUnlink.apply(fs, arguments)
    }

    temp.mkdir(function (err, dir) {
      if (err) return done(err)

      uploadDir = dir
      var upload = multer({ dest: dir })
      var app = express()

      app.post('/upload', upload.single('file'), function (req, res) {
        res.json({ success: true })
      })

      app.use(function (err, req, res, next) {
        res.status(500).json({ error: err.message })
      })

      server = app.listen(0, function () {
        port = server.address().port
        done()
      })
    })
  })

  afterEach(function (done) {
    fs.unlink = realUnlink
    server.close(function () {
      rimraf(uploadDir, done)
    })
  })

  it('should close the write stream before unlinking when the client aborts', function (done) {
    this.timeout(5000)

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

      setTimeout(function () {
        var files = fs.readdirSync(uploadDir)
        assert.strictEqual(files.length, 0, 'orphan files after client abort: ' + files.join(', '))
        done()
      }, 500)
    }, 50)
  })
})
