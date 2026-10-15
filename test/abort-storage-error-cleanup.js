/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var http = require('http')

var express = require('express')
var multer = require('../')

// When a file hits the fileSize limit (which aborts this upload) and its
// storage engine then reports an error, the engine stored nothing: the file
// has no path, so it must not be added to the abort cleanup list. A path-less
// entry would reach the storage _removeFile and unlink an undefined path.
describe('abort cleanup when a storage engine errors after the fileSize limit', function () {
  it('should report the limit error without crashing on a path-less file', function (done) {
    this.timeout(5000)

    var removeCalls = []
    var storage = {
      _handleFile: function (req, file, cb) {
        // Complete with an error once this file's fileSize limit has aborted
        // it, the shape a diskStorage destination/filename cb(err) takes in
        // that window. Nothing is stored, so no path is assigned.
        file.stream.on('limit', function () {
          cb(new Error('storage failed'))
        })
        file.stream.resume()
      },
      _removeFile: function (req, file, cb) {
        removeCalls.push(file.path)
        // Mirror DiskStorage: unlink the stored path. A path-less file here
        // throws synchronously (fs.unlink(undefined)).
        fs.unlink(file.path, function () { cb() })
      }
    }

    var upload = multer({ storage: storage, limits: { fileSize: 8 } })
    var app = express()
    var captured = null

    app.post('/upload', upload.single('file'), function (req, res) {
      res.json({ ok: true })
    })

    app.use(function (err, req, res, next) {
      captured = err
      res.status(400).json({ code: err.code || err.message })
    })

    var server = app.listen(0, function () {
      var port = server.address().port
      var boundary = 'AbortStorageErr' + Date.now()
      var body =
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="file"; filename="big.bin"\r\n' +
        'Content-Type: application/octet-stream\r\n\r\n' +
        'this is more than eight bytes\r\n' +
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
            server.close(function () {
              assert.ok(captured, 'expected an upload error')
              assert.strictEqual(captured.code, 'LIMIT_FILE_SIZE')
              done()
            })
          }, 200)
        })
      })

      req.on('error', done)
      req.end(body)
    })
  })
})
