/* eslint-env mocha */

const assert = require('assert')
const assertRejects = require('assert-rejects')
const FormData = require('form-data')

const multer = require('../')
const util = require('./_util')

describe('upload.array', function () {
  let parser

  before(function () {
    parser = multer().array('files', 3)
  })

  it('should accept single file', function () {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('files', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.body.name, 'Multer')

      assert.strictEqual(req.files.length, 1)

      return util.assertFile(req.files[0], 'files', 'small')
    })
  })

  it('should accept array of files', function () {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('files', util.file('empty'))
    form.append('files', util.file('small'))
    form.append('files', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.body.name, 'Multer')
      assert.strictEqual(req.files.length, 3)

      return util.assertFiles([
        [req.files[0], 'files', 'empty'],
        [req.files[1], 'files', 'small'],
        [req.files[2], 'files', 'tiny']
      ])
    })
  })

  it('should reject too many files', function () {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('files', util.file('small'))
    form.append('files', util.file('small'))
    form.append('files', util.file('small'))
    form.append('files', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_FILE_COUNT')
        assert.strictEqual(err.field, 'files')

        return true
      }
    )
  })

  it('should reject unexpected field', function () {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('unexpected', util.file('small'))

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
