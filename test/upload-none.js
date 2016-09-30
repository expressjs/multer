/* eslint-env mocha */

var assert = require('assert')
var assertRejects = require('assert-rejects')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

describe('upload.none', function () {
  var parser

  before(function () {
    parser = multer().none()
  })

  it('should handle text fields', function () {
    var form = new FormData()
    var parser = multer().none()

    form.append('foo', 'bar')
    form.append('test', 'yes')

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.file, undefined)
      assert.equal(req.files, undefined)

      assert.equal(req.body.foo, 'bar')
      assert.equal(req.body.test, 'yes')
    })
  })

  it('should reject single file', function () {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.equal(err.field, 'file')

        return true
      }
    )
  })

  it('should reject multiple files', function () {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('tiny'))
    form.append('file', util.file('tiny'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.equal(err.field, 'file')

        return true
      }
    )
  })
})
