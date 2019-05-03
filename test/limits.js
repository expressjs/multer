/* eslint-env mocha */

const assert = require('assert')

const util = require('./_util')
const multer = require('../')
const FormData = require('form-data')
const assertRejects = require('assert-rejects')

describe('limits', function () {
  it('should report limit errors', function () {
    const form = new FormData()
    const parser = multer({ limits: { fileSize: 100 } }).single('file')

    form.append('file', util.file('large'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')
        assert.strictEqual(err.field, 'file')

        return true
      }
    )
  })
})
