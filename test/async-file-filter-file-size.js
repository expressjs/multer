/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var os = require('os')
var path = require('path')
var http = require('http')

var express = require('express')
var rimraf = require('rimraf')
var multer = require('../')

describe('async fileFilter fileSize limit (disk storage)', function () {
  var uploadDir, server, port

  var boundary = 'AsyncFilterSizeBound'
  var oversizedBody =
    '--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="file"; filename="big.bin"\r\n' +
    'Content-Type: application/octet-stream\r\n\r\n' +
    Buffer.alloc(2048, 0x41).toString() + '\r\n' +
    '--' + boundary + '--\r\n'

  function filePart (field, name, size) {
    return '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="' + field + '"; filename="' + name + '"\r\n' +
      'Content-Type: application/octet-stream\r\n\r\n' +
      Buffer.alloc(size, 0x41).toString() + '\r\n'
  }

  // three files, the middle one over the 1024 byte limit
  var multiBody =
    filePart('files', 'a.bin', 512) +
    filePart('files', 'b.bin', 2048) +
    filePart('files', 'c.bin', 512) +
    '--' + boundary + '--\r\n'

  function startServer (fileFilter, done) {
    fs.mkdtemp(path.join(os.tmpdir(), 'multer-async-size-'), function (err, dir) {
      if (err) return done(err)

      uploadDir = dir
      var upload = multer({
        dest: dir,
        fileFilter: fileFilter,
        limits: { fileSize: 1024 }
      })
      var app = express()

      app.post('/upload', upload.single('file'), function (req, res) {
        res.json({ ok: true, size: req.file ? req.file.size : null })
      })

      app.post('/upload-multi', upload.array('files'), function (req, res) {
        res.json({ ok: true, count: req.files.length })
      })

      app.use(function (err, req, res, next) {
        res.status(400).json({ code: err.code, field: err.field })
      })

      server = app.listen(0, function () {
        port = server.address().port
        done()
      })
    })
  }

  function post (path, body, cb) {
    var req = http.request({
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': Buffer.byteLength(body)
      }
    }, function (res) {
      var data = ''
      res.on('data', function (c) { data += c })
      res.on('end', function () { cb(res.statusCode, JSON.parse(data)) })
    })

    req.on('error', cb)
    req.end(body)
  }

  afterEach(function (done) {
    server.close(function () {
      rimraf(uploadDir, done)
    })
  })

  it('should reject an oversized file accepted by an async fileFilter', function (done) {
    this.timeout(5000)

    startServer(async function (req, file, cb) {
      await Promise.resolve()
      cb(null, true)
    }, function () {
      post('/upload', oversizedBody, function (status, body) {
        assert.strictEqual(status, 400)
        assert.strictEqual(body.code, 'LIMIT_FILE_SIZE')
        assert.strictEqual(body.field, 'file')

        setTimeout(function () {
          var files = fs.readdirSync(uploadDir)
          assert.strictEqual(files.length, 0, 'orphan files after oversized reject: ' + files.join(', '))
          done()
        }, 250)
      })
    })
  })

  it('should silently skip an oversized file rejected by an async fileFilter', function (done) {
    this.timeout(5000)

    startServer(async function (req, file, cb) {
      await Promise.resolve()
      cb(null, false)
    }, function () {
      post('/upload', oversizedBody, function (status, body) {
        assert.strictEqual(status, 200)
        assert.strictEqual(body.ok, true)
        assert.strictEqual(body.size, null)

        setTimeout(function () {
          var files = fs.readdirSync(uploadDir)
          assert.strictEqual(files.length, 0, 'orphan files after oversized skip: ' + files.join(', '))
          done()
        }, 250)
      })
    })
  })

  it('should reject when one of several files is oversized', function (done) {
    this.timeout(5000)

    startServer(async function (req, file, cb) {
      await Promise.resolve()
      cb(null, true)
    }, function () {
      post('/upload-multi', multiBody, function (status, body) {
        assert.strictEqual(status, 400)
        assert.strictEqual(body.code, 'LIMIT_FILE_SIZE')
        assert.strictEqual(body.field, 'files')

        setTimeout(function () {
          var files = fs.readdirSync(uploadDir)
          assert.strictEqual(files.length, 0, 'orphan files after multi-file reject: ' + files.join(', '))
          done()
        }, 250)
      })
    })
  })
})
