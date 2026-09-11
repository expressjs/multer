/* eslint-env mocha */

var assert = require('assert')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

describe('limits as a function', function () {
  it('should call the function with the request and apply the returned limits', function (done) {
    var seen = []
    var upload = multer({
      limits: function (req) {
        seen.push(req)
        return { fileSize: req.maxUploadSize }
      }
    })
    var parser = upload.single('file')

    var form1 = new FormData()
    form1.append('file', util.file('small0.dat'))

    util.submitForm(function (req, res, next) {
      req.maxUploadSize = 100
      parser(req, res, next)
    }, form1, function (err, req1) {
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')

      var form2 = new FormData()
      form2.append('file', util.file('small0.dat'))

      util.submitForm(function (req, res, next) {
        req.maxUploadSize = Infinity
        parser(req, res, next)
      }, form2, function (err, req2) {
        assert.ifError(err)
        assert.strictEqual(req2.file.size, 1778)
        assert.strictEqual(seen.length, 2)
        assert.strictEqual(seen[0], req1)
        assert.strictEqual(seen[1], req2)
        done()
      })
    })
  })

  it('should treat a function returning nothing as no limits', function (done) {
    var parser = multer({ limits: function () {} }).single('file')
    var form = new FormData()

    form.append('file', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.file.size, 1778)
      done()
    })
  })

  it('should pass invalid returned limits to next()', function (done) {
    var parser = multer({ limits: function () { return { fileSize: 1.5 } } }).none()
    var form = new FormData()

    form.append('name', 'value')

    util.submitForm(parser, form, function (err) {
      assert.ok(err instanceof TypeError)
      assert.strictEqual(err.message, 'Expected limits.fileSize to be a non-negative integer or Infinity')
      done()
    })
  })

  it('should pass errors thrown by the function to next()', function (done) {
    var parser = multer({ limits: function () { throw new Error('no limits for you') } }).none()
    var form = new FormData()

    form.append('name', 'value')

    util.submitForm(parser, form, function (err) {
      assert.strictEqual(err.message, 'no limits for you')
      done()
    })
  })
})
