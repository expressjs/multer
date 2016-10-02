/* eslint-env mocha */

var assert = require('assert')
var assertRejects = require('assert-rejects')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

describe('upload.array', function () {
  var parser

  before(function () {
    parser = multer().array('files', 3)
  })

  it('should accept single file', function () {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('files', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.equal(req.files.length, 1)

      return util.assertFile(req.files[0], 'files', 'small')
    })
  })

  it('should accept array of files', function () {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('files', util.file('empty'))
    form.append('files', util.file('small'))
    form.append('files', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')
      assert.equal(req.files.length, 3)

      return util.assertFiles([
        [req.files[0], 'files', 'empty'],
        [req.files[1], 'files', 'small'],
        [req.files[2], 'files', 'tiny']
      ])
    })
  })

  it('should reject too many files', function () {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('files', util.file('small'))
    form.append('files', util.file('small'))
    form.append('files', util.file('small'))
    form.append('files', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_FILE_COUNT')
        assert.equal(err.field, 'files')

        return true
      }
    )
  })

  it('should reject unexpected field', function () {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('unexpected', util.file('small'))

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
