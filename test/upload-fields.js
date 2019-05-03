/* eslint-env mocha */

const assert = require('assert')
const assertRejects = require('assert-rejects')
const FormData = require('form-data')

const multer = require('../')
const util = require('./_util')

describe('upload.fields', function () {
  let parser

  before(function () {
    parser = multer().fields([
      { name: 'CA$|-|', maxCount: 1 },
      { name: 'set-1', maxCount: 3 },
      { name: 'set-2', maxCount: 3 }
    ])
  })

  it('should accept single file', function () {
    const form = new FormData()

    form.append('set-2', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.files['CA$|-|'].length, 0)
      assert.strictEqual(req.files['set-1'].length, 0)
      assert.strictEqual(req.files['set-2'].length, 1)

      return util.assertFile(req.files['set-2'][0], 'set-2', 'tiny')
    })
  })

  it('should accept some files', function () {
    const form = new FormData()

    form.append('CA$|-|', util.file('empty'))
    form.append('set-1', util.file('small'))
    form.append('set-1', util.file('empty'))
    form.append('set-2', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.files['CA$|-|'].length, 1)
      assert.strictEqual(req.files['set-1'].length, 2)
      assert.strictEqual(req.files['set-2'].length, 1)

      return util.assertFiles([
        [req.files['CA$|-|'][0], 'CA$|-|', 'empty'],
        [req.files['set-1'][0], 'set-1', 'small'],
        [req.files['set-1'][1], 'set-1', 'empty'],
        [req.files['set-2'][0], 'set-2', 'tiny']
      ])
    })
  })

  it('should accept all files', function () {
    const form = new FormData()

    form.append('CA$|-|', util.file('empty'))
    form.append('set-1', util.file('tiny'))
    form.append('set-1', util.file('empty'))
    form.append('set-1', util.file('tiny'))
    form.append('set-2', util.file('tiny'))
    form.append('set-2', util.file('tiny'))
    form.append('set-2', util.file('empty'))

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.files['CA$|-|'].length, 1)
      assert.strictEqual(req.files['set-1'].length, 3)
      assert.strictEqual(req.files['set-2'].length, 3)

      return util.assertFiles([
        [req.files['CA$|-|'][0], 'CA$|-|', 'empty'],
        [req.files['set-1'][0], 'set-1', 'tiny'],
        [req.files['set-1'][1], 'set-1', 'empty'],
        [req.files['set-1'][2], 'set-1', 'tiny'],
        [req.files['set-2'][0], 'set-2', 'tiny'],
        [req.files['set-2'][1], 'set-2', 'tiny'],
        [req.files['set-2'][2], 'set-2', 'empty']
      ])
    })
  })

  it('should reject too many files', function () {
    const form = new FormData()

    form.append('CA$|-|', util.file('small'))
    form.append('CA$|-|', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_FILE_COUNT')
        assert.strictEqual(err.field, 'CA$|-|')

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
