/* eslint-env mocha */

var assert = require('assert')
var http = require('http')

var multer = require('../')
var util = require('./_util')

var express = require('express')
var FormData = require('form-data')
var concat = require('concat-stream')

var port = 34279

describe('Express Integration', function () {
  var app

  before(function (done) {
    app = express()
    app.listen(port, done)
  })

  function submitForm (form, path, cb) {
    var req = form.submit('http://localhost:' + port + path)

    req.on('error', cb)
    req.on('response', function (res) {
      res.on('error', cb)
      res.pipe(concat({ encoding: 'buffer' }, function (body) {
        cb(null, res, body)
      }))
    })
  }

  it('should work with express error handling', function (done) {
    var limits = { fileSize: 200 }
    var upload = multer({ limits: limits })
    var router = new express.Router()
    var form = new FormData()

    var routeCalled = 0
    var errorCalled = 0

    form.append('avatar', util.file('large.jpg'))

    router.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use(function (err, req, res, next) {
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')

      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t1', router)
    submitForm(form, '/t1/profile', function (err, res, body) {
      assert.ifError(err)

      assert.strictEqual(routeCalled, 0)
      assert.strictEqual(errorCalled, 1)
      assert.strictEqual(body.toString(), 'ERROR')
      assert.strictEqual(res.statusCode, 500)

      done()
    })
  })

  it('should work when receiving error from fileFilter', function (done) {
    function fileFilter (req, file, cb) {
      cb(new Error('TEST'))
    }

    var upload = multer({ fileFilter: fileFilter })
    var router = new express.Router()
    var form = new FormData()

    var routeCalled = 0
    var errorCalled = 0

    form.append('avatar', util.file('large.jpg'))

    router.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use(function (err, req, res, next) {
      assert.strictEqual(err.message, 'TEST')

      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t2', router)
    submitForm(form, '/t2/profile', function (err, res, body) {
      assert.ifError(err)

      assert.strictEqual(routeCalled, 0)
      assert.strictEqual(errorCalled, 1)
      assert.strictEqual(body.toString(), 'ERROR')
      assert.strictEqual(res.statusCode, 500)

      done()
    })
  })

  it('should not crash on malformed request', function (done) {
    var upload = multer()

    app.post('/upload', upload.single('file'), function (req, res) {
      res.status(500).end('Request should not be processed')
    })

    app.use(function (err, req, res, next) {
      assert.strictEqual(err.message, 'Unexpected end of form')
      res.status(200).end('Correct error')
    })

    var boundary = 'AaB03x'
    var body = [
      '--' + boundary,
      'Content-Disposition: form-data; name="file"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      'test without end boundary'
    ].join('\r\n')
    var options = {
      hostname: 'localhost',
      port,
      path: '/upload',
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=' + boundary,
        'content-length': body.length
      }
    }

    var req = http.request(options, (res) => {
      assert.strictEqual(res.statusCode, 200)
      done()
    })

    req.on('error', (err) => {
      done(err)
    })

    req.write(body)
    req.end()
  })

  it('should not crash on malformed request that causes two errors to be emitted by busboy', function (done) {
    var upload = multer()

    app.post('/upload2', upload.single('file'), function (req, res) {
      res.status(500).end('Request should not be processed')
    })

    app.use(function (err, req, res, next) {
      assert.strictEqual(err.message, 'Malformed part header')
      res.status(200).end('Correct error')
    })

    var boundary = 'AaB03x'
    // this payload causes two errors to be emitted by busboy: `Malformed part header` and `Unexpected end of form`
    var body = [
      '--' + boundary,
      'Content-Disposition: form-data; name="file"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      '--' + boundary + '--',
      ''
    ].join('\r\n')
    var options = {
      hostname: 'localhost',
      port,
      path: '/upload2',
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=' + boundary,
        'content-length': body.length
      }
    }

    var req = http.request(options, (res) => {
      assert.strictEqual(res.statusCode, 200)
      done()
    })

    req.on('error', (err) => {
      done(err)
    })

    req.write(body)
    req.end()
  })
})
