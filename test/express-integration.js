/* eslint-env mocha */

var assert = require('assert')

var multer = require('../')
var util = require('./_util')

var pify = require('pify')
var express = require('express')
var FormData = require('form-data')
var getStream = require('get-stream')

var onFinished = pify(require('on-finished'))

var port = 34279

describe('Express Integration', function () {
  var app

  before(function (done) {
    app = express()
    app.listen(port, done)
  })

  function submitForm (form, path) {
    return new Promise(function (resolve, reject) {
      var req = form.submit('http://localhost:' + port + path)

      req.on('error', reject)
      req.on('response', function (res) {
        res.on('error', reject)

        var body = getStream.buffer(res)
        var finished = onFinished(req)

        resolve(Promise.all([body, finished]).then(function (result) {
          return { res: res, body: result[0] }
        }))
      })
    })
  }

  it('should work with express error handling', function () {
    var limits = { fileSize: 200 }
    var upload = multer({ limits: limits })
    var router = new express.Router()
    var form = new FormData()

    var routeCalled = 0
    var errorCalled = 0

    form.append('avatar', util.file('large'))

    router.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use(function (err, req, res, next) {
      assert.equal(err.code, 'LIMIT_FILE_SIZE')

      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t1', router)
    return submitForm(form, '/t1/profile').then(function (result) {
      assert.equal(routeCalled, 0)
      assert.equal(errorCalled, 1)
      assert.equal(result.body.toString(), 'ERROR')
      assert.equal(result.res.statusCode, 500)
    })
  })

  it('should work when uploading a file', function () {
    var upload = multer()
    var router = new express.Router()
    var form = new FormData()

    var routeCalled = 0
    var errorCalled = 0

    form.append('avatar', util.file('large'))

    router.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use(function (_, req, res, next) {
      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t2', router)
    return submitForm(form, '/t2/profile').then(function (result) {
      assert.equal(routeCalled, 1)
      assert.equal(errorCalled, 0)
      assert.equal(result.body.toString(), 'SUCCESS')
      assert.equal(result.res.statusCode, 200)
    })
  })
})
