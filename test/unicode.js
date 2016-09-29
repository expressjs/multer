/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Unicode', function () {
  it('should handle unicode filenames', function () {
    var form = new FormData()
    var parser = multer().single('small0')
    var filename = '\ud83d\udca9.dat'

    form.append('small0', util.file('small0.dat'), { filename: filename })

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.file.originalName, filename)
      assert.equal(req.file.fieldName, 'small0')
      assert.equal(req.file.size, 1778)

      return util.assertStreamSize(req.file.stream, 1778)
    })
  })
})
