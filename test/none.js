/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('None', function () {
  var parser

  before(function () {
    parser = multer().none()
  })

  it('should not allow file uploads', function (done) {
    var form = new FormData()

    form.append('key1', 'val1')
    form.append('key2', 'val2')
    form.append('file', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err)
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(req.files, undefined)
      assert.equal(req.body['key1'], 'val1')
      assert.equal(req.body['key2'], 'val2')
      done()
    })
  })

  it('should handle text fields', function (done) {
    var form = new FormData()

    form.append('key1', 'val1')
    form.append('key2', 'val2')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.equal(req.files, undefined)
      assert.equal(req.body['key1'], 'val1')
      assert.equal(req.body['key2'], 'val2')
      done()
    })
  })
})
