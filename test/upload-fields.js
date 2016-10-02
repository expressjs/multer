/* eslint-env mocha */

var assert = require('assert')
var assertRejects = require('assert-rejects')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

describe('upload.fields', function () {
  var parser

  before(function () {
    parser = multer().fields([
      { name: 'CA$|-|', maxCount: 1 },
      { name: 'set-1', maxCount: 3 },
      { name: 'set-2', maxCount: 3 }
    ])
  })

  it('should accept single file', function () {
    var form = new FormData()

    form.append('set-2', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files['CA$|-|'].length, 0)
      assert.equal(req.files['set-1'].length, 0)
      assert.equal(req.files['set-2'].length, 1)

      return util.assertFile(req.files['set-2'][0], 'set-2', 'tiny')
    })
  })

  it('should accept some files', function () {
    var form = new FormData()

    form.append('CA$|-|', util.file('empty'))
    form.append('set-1', util.file('small'))
    form.append('set-1', util.file('empty'))
    form.append('set-2', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files['CA$|-|'].length, 1)
      assert.equal(req.files['set-1'].length, 2)
      assert.equal(req.files['set-2'].length, 1)

      return util.assertFiles([
        [req.files['CA$|-|'][0], 'CA$|-|', 'empty'],
        [req.files['set-1'][0], 'set-1', 'small'],
        [req.files['set-1'][1], 'set-1', 'empty'],
        [req.files['set-2'][0], 'set-2', 'tiny']
      ])
    })
  })

  it('should accept all files', function () {
    var form = new FormData()

    form.append('CA$|-|', util.file('empty'))
    form.append('set-1', util.file('tiny'))
    form.append('set-1', util.file('empty'))
    form.append('set-1', util.file('tiny'))
    form.append('set-2', util.file('tiny'))
    form.append('set-2', util.file('tiny'))
    form.append('set-2', util.file('empty'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files['CA$|-|'].length, 1)
      assert.equal(req.files['set-1'].length, 3)
      assert.equal(req.files['set-2'].length, 3)

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
    var form = new FormData()

    form.append('CA$|-|', util.file('small'))
    form.append('CA$|-|', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_FILE_COUNT')
        assert.equal(err.field, 'CA$|-|')

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
