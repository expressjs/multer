/* eslint-env mocha */

var assert = require('assert')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

describe('upload.any', function () {
  var parser

  before(function () {
    parser = multer().any()
  })

  it('should accept single file', function () {
    var form = new FormData()

    form.append('test', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files.length, 1)

      return util.assertFile(req.files[0], 'test', 'tiny')
    })
  })

  it('should accept some files', function () {
    var form = new FormData()

    form.append('foo', util.file('empty'))
    form.append('foo', util.file('small'))
    form.append('test', util.file('empty'))
    form.append('anyname', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files.length, 4)

      return util.assertFiles([
        [req.files[0], 'foo', 'empty'],
        [req.files[1], 'foo', 'small'],
        [req.files[2], 'test', 'empty'],
        [req.files[3], 'anyname', 'tiny']
      ])
    })
  })

  it('should accept any files', function () {
    var form = new FormData()

    form.append('set-0', util.file('empty'))
    form.append('set-1', util.file('tiny'))
    form.append('set-0', util.file('empty'))
    form.append('set-1', util.file('tiny'))
    form.append('set-2', util.file('tiny'))
    form.append('set-1', util.file('tiny'))
    form.append('set-2', util.file('empty'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files.length, 7)

      return util.assertFiles([
        [req.files[0], 'set-0', 'empty'],
        [req.files[1], 'set-1', 'tiny'],
        [req.files[2], 'set-0', 'empty'],
        [req.files[3], 'set-1', 'tiny'],
        [req.files[4], 'set-2', 'tiny'],
        [req.files[5], 'set-1', 'tiny'],
        [req.files[6], 'set-2', 'empty']
      ])
    })
  })
})
