/* eslint-env mocha */

const assert = require('assert')
const assertRejects = require('assert-rejects')
const FormData = require('form-data')

const multer = require('../')
const util = require('./_util')

describe('upload.none', function () {
  let parser

  before(function () {
    parser = multer().none()
  })

  it('should handle text fields', function () {
    const form = new FormData()
    const parser = multer().none()

    form.append('foo', 'bar')
    form.append('test', 'yes')

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.file, undefined)
      assert.strictEqual(req.files, undefined)

      assert.strictEqual(req.body.foo, 'bar')
      assert.strictEqual(req.body.test, 'yes')
    })
  })

  it('should reject single file', function () {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.strictEqual(err.field, 'file')

        return true
      }
    )
  })

  it('should reject multiple files', function () {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('tiny'))
    form.append('file', util.file('tiny'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.strictEqual(err.field, 'file')

        return true
      }
    )
  })
})
