/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var os = require('os')
var path = require('path')
var http = require('http')

var express = require('express')
var multer = require('../')

describe('async fileFilter cleanup', function () {
  it('does not leave orphan files when request aborts with missing field name', function (done) {
    var uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multer-orphan-'))
    var app = express()

    var upload = multer({
      dest: uploadDir,
      fileFilter: function (req, file, cb) {
        setImmediate(function () { cb(null, true) })
      }
    })

    app.post('/upload', upload.any(), function (req, res) {
      res.json({ success: true })
    })

    app.use(function (err, req, res, next) {
      res.status(400).json({ error: err.code })
    })

    var server = app.listen(0, function () {
      var port = server.address().port
      var boundary = 'TestBound'
      var body =
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="f"; filename="a.bin"\r\n' +
        'Content-Type: application/octet-stream\r\n\r\nORPHAN FILE DATA\r\n' +
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; filename="b.bin"\r\n' +
        'Content-Type: application/octet-stream\r\n\r\nx\r\n' +
        '--' + boundary + '--\r\n'

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
            var files = fs.readdirSync(uploadDir)
            assert.strictEqual(res.statusCode, 400)
            assert.strictEqual(files.length, 0)
            server.close(done)
          }, 500)
        })
      })

      req.on('error', function (err) {
        server.close(function () {
          done(err)
        })
      })

      req.write(body)
      req.end()
    })
  })
}
)
