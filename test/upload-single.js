/* eslint-env mocha */

var assert = require('assert')
var assertRejects = require('assert-rejects')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

describe('upload.single', function () {
  var parser

  before(function () {
    parser = multer().single('file')
  })

  it('should accept single file', function () {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      return util.assertFile(req.file, 'file', 'small')
    })
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

  it('should reject unexpected field', function () {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('unexpected', util.file('tiny'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.equal(err.field, 'unexpected')

        return true
      }
    )
  })
})
