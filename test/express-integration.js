/* eslint-env mocha */

var assert = require('assert')

var multer = require('../')
var util = require('./_util')

var express = require('express')
var FormData = require('form-data')
var concat = require('concat-stream')
var onFinished = require('on-finished')

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
        onFinished(req, function () { cb(null, res, body) })
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
})
