/* eslint-env mocha */

const assert = require('assert')
const assertRejects = require('assert-rejects')
const FormData = require('form-data')

const multer = require('../')
const util = require('./_util')

describe('upload.single', function () {
  let parser

  before(function () {
    parser = multer().single('file')
  })

  it('should accept single file', function () {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.body.name, 'Multer')

      return util.assertFile(req.file, 'file', 'small')
    })
  })

  it('should reject multiple files', function () {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('tiny'))
    form.append('file', util.file('tiny'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_FILE_COUNT')
        assert.strictEqual(err.field, 'file')

        return true
      }
    )
  })

  it('should reject unexpected field', function () {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('unexpected', util.file('tiny'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.strictEqual(err.field, 'unexpected')

        return true
      }
    )
  })
})
