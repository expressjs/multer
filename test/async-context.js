/* eslint-env mocha */

var assert = require('assert')
var express = require('express')
var FormData = require('form-data')
var concat = require('concat-stream')
var multer = require('..')

var asyncHooks = require('async_hooks')

var port = 34280

describe('Async context preservation', function () {
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

  it('should preserve AsyncLocalStorage context across multer processing', function (done) {
    if (!asyncHooks || typeof asyncHooks.AsyncResource !== 'function' || typeof asyncHooks.AsyncResource.bind !== 'function') {
      this.skip()
    }

    if (typeof asyncHooks.AsyncLocalStorage !== 'function') {
      this.skip()
    }

    var AsyncLocalStorage = asyncHooks.AsyncLocalStorage
    var als = new AsyncLocalStorage()

    var upload = multer()
    var form = new FormData()

    form.append('field', 'value')

    app.post('/ctx', function (req, res, next) {
      als.run({ requestId: 'abc-123' }, function () { next() })
    }, upload.none(), function (req, res) {
      var store = als.getStore()
      var requestId = store && store.requestId
      res.status(200).end(requestId || 'NO_CONTEXT')
    })

    submitForm(form, '/ctx', function (err, res, body) {
      assert.ifError(err)
      assert.strictEqual(res.statusCode, 200)
      assert.strictEqual(body.toString(), 'abc-123')
      done()
    })
  })
})

