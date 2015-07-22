/* eslint-env mocha */

var assert = require('assert')

var multer = require('../')
var util = require('./_util')

var express = require('express')
var FormData = require('form-data')
var concat = require('concat-stream')

var port = 34279

describe('Express Integration', function () {
  it('should work with express error handling', function (done) {
    var app = express()
    var limits = { fileSize: 200 }
    var upload = multer({ limits: limits })
    var form = new FormData()

    var routeCalled = 0
    var errorCalled = 0

    form.append('avatar', util.file('large.jpg'))

    app.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    app.use(function (err, req, res, next) {
      assert.equal(err.code, 'LIMIT_FILE_SIZE')

      errorCalled++
      res.status(500).end('ERROR')
    })

    app.listen(port, function () {
      var res, body
      var req = form.submit('http://localhost:' + port + '/profile')
      var pending = 2

      function validate () {
        assert.equal(routeCalled, 0)
        assert.equal(errorCalled, 1)
        assert.equal(body.toString(), 'ERROR')
        assert.equal(res.statusCode, 500)

        done()
      }

      req.on('response', function (_res) {
        res = _res

        res.pipe(concat({ encoding: 'buffer' }, function (_body) {
          body = _body

          if (--pending === 0) validate()
        }))
      })

      req.on('finish', function () {
        if (--pending === 0) validate()
      })
    })
  })
})
