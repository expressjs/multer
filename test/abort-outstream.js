/* eslint-env mocha */

var assert = require('assert')
var http = require('http')
var net = require('net')
var stream = require('stream')
var multer = require('../')

function TrackingWritable () {
  stream.Writable.call(this, { autoDestroy: false })
  this.destroyCalls = 0
}

TrackingWritable.prototype = Object.create(stream.Writable.prototype)
TrackingWritable.prototype.constructor = TrackingWritable

TrackingWritable.prototype._write = function (chunk, encoding, callback) {
  callback()
}

TrackingWritable.prototype._destroy = function (err, callback) {
  this.destroyCalls++
  callback(err)
}

function makeStorage (opts) {
  var captured = {}

  var storage = {
    _handleFile: function (req, file, cb) {
      var outStream = new TrackingWritable()
      captured.outStream = outStream
      file.outStream = outStream

      // realistic engines always handle their own stream errors
      outStream.on('error', function () {})

      file.stream.pipe(outStream)

      outStream.on('finish', function () {
        if (opts.hold) return
        cb(null, { path: 'tracked-' + Date.now(), size: outStream.bytesWritten })
      })
    },

    _removeFile: function (req, file, cb) {
      cb(null)
    }
  }

  return { storage: storage, captured: captured }
}

describe('abort with custom storage exposing outStream', function () {
  it('should not destroy the outStream when the upload completes normally', function (done) {
    var harness = makeStorage({ hold: false })
    var upload = multer({ storage: harness.storage }).single('file')

    var server = http.createServer(function (req, res) {
      upload(req, res, function (err) {
        assert.ifError(err)
        res.writeHead(200)
        res.end('ok')
      })
    })

    server.listen(0, function () {
      var port = server.address().port
      var boundary = 'normal' + Date.now()
      var body = Buffer.concat([
        Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="a.txt"\r\nContent-Type: text/plain\r\n\r\n'),
        Buffer.from('hello world\r\n'),
        Buffer.from('--' + boundary + '--\r\n')
      ])

      var req = http.request({
        host: '127.0.0.1',
        port: port,
        method: 'POST',
        path: '/',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
          'Content-Length': body.length
        }
      }, function (res) {
        res.resume()
        res.on('end', function () {
          assert.strictEqual(harness.captured.outStream.destroyCalls, 0)
          server.close()
          done()
        })
      })

      req.end(body)
    })
  })

  it('should destroy the outStream when the client aborts mid-upload', function (done) {
    this.timeout(5000)

    var harness = makeStorage({ hold: true })
    var upload = multer({ storage: harness.storage }).single('file')

    var server = http.createServer(function (req, res) {
      var hung = false

      var timer = setTimeout(function () {
        hung = true
        server.close()
        done(new Error('Middleware hung when client aborted request'))
      }, 2000)

      upload(req, res, function (err) {
        if (hung) return
        clearTimeout(timer)

        try {
          assert.ok(err, 'expected an error after client abort')
          assert.strictEqual(harness.captured.outStream.destroyCalls, 1)
        } catch (assertErr) {
          server.close()
          return done(assertErr)
        }

        server.close()
        done()
      })
    })

    server.listen(0, function () {
      var port = server.address().port
      var boundary = 'abort' + Date.now()
      var sock = new net.Socket()

      sock.connect(port, '127.0.0.1', function () {
        sock.write(
          'POST / HTTP/1.1\r\n' +
          'Host: localhost\r\n' +
          'Content-Type: multipart/form-data; boundary=' + boundary + '\r\n' +
          'Content-Length: 999999\r\n\r\n' +
          '--' + boundary + '\r\n' +
          'Content-Disposition: form-data; name="file"; filename="a.txt"\r\n' +
          'Content-Type: text/plain\r\n\r\n' +
          'partial body content'
        )

        // abort mid-upload
        setTimeout(function () { sock.destroy() }, 100)
      })
    })
  })
})
