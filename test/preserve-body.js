/* eslint-env mocha */

var assert = require('assert')
var express = require('express')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

var port = 34280

describe('Preserve Body', function () {
  var app

  before(function (done) {
    app = express()
    app.listen(port, done)
  })

  function submitForm (form, path, cb) {
    var req = form.submit('http://localhost:' + port + path)
    req.on('response', cb)
  }

  function setBodyValue () {
    return function (req, res, next) {
      req.body = { user: 'TEST' }
      next()
    }
  }

  it('should overwrite request body object when no preserveBody option provided', function (done) {
    var upload = multer()
    var router = new express.Router()
    var form = new FormData()
    var reqBody

    form.append('avatar', util.file('large.jpg'))

    router.post('/profile', setBodyValue(), upload.single('avatar'), function (req, res, next) {
      reqBody = req.body
      res.status(200).end('SUCCESS')
    })

    app.use('/t1', router)
    submitForm(form, '/t1/profile', function () {
      assert.strictEqual(reqBody.user, undefined)
      done()
    })
  })

  it('should not overwrite request body object when preserveBody is true', function (done) {
    var upload = multer({ preserveBody: true })
    var router = new express.Router()
    var form = new FormData()
    var reqBody

    form.append('avatar', util.file('large.jpg'))

    router.post('/profile', setBodyValue(), upload.single('avatar'), function (req, res, next) {
      reqBody = req.body
      res.status(200).end('SUCCESS')
    })

    app.use('/t2', router)
    submitForm(form, '/t2/profile', function () {
      assert.strictEqual(reqBody.user, 'TEST')
      done()
    })
  })

  it('should overwrite request body object when preserveBody is false', function (done) {
    var upload = multer({ preserveBody: false })
    var router = new express.Router()
    var form = new FormData()
    var reqBody

    form.append('avatar', util.file('large.jpg'))

    router.post('/profile', setBodyValue(), upload.single('avatar'), function (req, res, next) {
      reqBody = req.body
      res.status(200).end('SUCCESS')
    })

    app.use('/t3', router)
    submitForm(form, '/t3/profile', function () {
      assert.strictEqual(reqBody.user, undefined)
      done()
    })
  })
})
