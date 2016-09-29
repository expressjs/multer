/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')
var assertRejects = require('assert-rejects')

describe('None', function () {
  it('should not allow file uploads', function () {
    var form = new FormData()
    var parser = multer().none()

    form.append('key1', 'val1')
    form.append('key2', 'val2')
    form.append('file', util.file('small0.dat'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) { return err.code === 'LIMIT_UNEXPECTED_FILE' }
    )
  })

  it('should handle text fields', function () {
    var form = new FormData()
    var parser = multer().none()

    form.append('key1', 'val1')
    form.append('key2', 'val2')

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files, undefined)
      assert.equal(req.body['key1'], 'val1')
      assert.equal(req.body['key2'], 'val2')
    })
  })
})
