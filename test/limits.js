/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')
var assertRejects = require('assert-rejects')

describe('Limits', function () {
  it('should report limit errors', function () {
    var form = new FormData()
    var parser = multer({ limits: { fileSize: 100 } }).single('file')

    form.append('file', util.file('large'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_FILE_SIZE')
        assert.equal(err.field, 'file')

        return true
      }
    )
  })
})
