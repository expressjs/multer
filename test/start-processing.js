/* eslint-env mocha */

var assert = require('assert')

var multer = require('../')
var util = require('./_util')

var express = require('express')
var FormData = require('form-data')
var concat = require('concat-stream')
var onFinished = require('on-finished')

var port = 34280
var localhostUrl = function (path) { return 'http://localhost:' + port + path }

describe('Start Processing', function () {
  var app
  var server

  beforeEach(function (done) {
    app = express()
    server = app.listen(port, done)
  })

  afterEach(function (done) {
    server.close(done)
  })

  function submitForm (form, path, cb) {
    var req = form.submit(localhostUrl(path))

    req.on('error', cb)
    req.on('response', function (res) {
      res.on('error', cb)
      res.pipe(concat({ encoding: 'buffer' }, function (body) {
        onFinished(req, function () { cb(null, res, body) })
      }))
    })
  }

  function testData (data, done) {
    var upload = multer(data.cfg)
    var form = new FormData()

    var routeCalled = 0
    var errorCalled = 0

    data.fields && data.fields.forEach(function (field) {
      form.append(field.key, field.value)
    })
    data.files && data.files.forEach(function (file) {
      form.append(file.key, util.file(file.value))
    })

    app.post('/test_route', upload.any(), function (req, res, next) {
      data.fields && data.fields.forEach(function (field) {
        assert.equal(req.body[field.key], field.value)
      })
      data.files && data.files.forEach(function (file, index) {
        assert.equal(req.files[index].fieldname, file.key)
        assert.equal(req.files[0].originalname, file.value)
      })

      routeCalled++
      res.status(200).end('SUCCESS')
    })

    app.use(function (err, req, res, next) {
      assert.ifError(err)

      errorCalled++
      res.status(500).end('ERROR')
    })

    submitForm(form, '/test_route', function (err, res, body) {
      assert.ifError(err)

      assert.equal(routeCalled, 1)
      assert.equal(errorCalled, 0)
      assert.equal(body.toString(), 'SUCCESS')
      assert.equal(res.statusCode, 200)

      done()
    })
  }

  it('should start processing by default', function (done) {
    testData({
      fields: [{key: 'testField', value: 'testValue1'}],
      files: [{key: 'testFile', value: 'tiny1.dat'}]
    }, done)
  })

  it('should invoke method to start processing', function (done) {
    app.use(function (req, res, next) {
      req.rawBody = ''
      req.setEncoding('utf8')
      req.on('data', function (chunk) { req.rawBody += chunk })
      req.on('end', function () {
        next()
      })
    })

    var startProcessingCallCount = 0

    testData({
      fields: [{key: 'testField', value: 'testValue1'}],
      files: [{key: 'testFile', value: 'tiny1.dat'}],
      cfg: {
        startProcessing: function (req, busboy) {
          assert.ok(req)
          assert.ok(busboy)
          assert.ok(req.rawBody)

          busboy.end(req.rawBody)
          startProcessingCallCount++
        }
      }
    }, function () {
      assert.equal(startProcessingCallCount, 1)
      done()
    })
  })
})
