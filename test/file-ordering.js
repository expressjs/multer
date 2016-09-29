/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('File ordering', function () {
  it('should present files in same order as they came', function () {
    var parser = multer().array('themFiles', 2)
    var form = new FormData()

    form.append('themFiles', util.file('small0.dat'))
    form.append('themFiles', util.file('small1.dat'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files.length, 2)
      assert.equal(req.files[0].originalName, 'small0.dat')
      assert.equal(req.files[1].originalName, 'small1.dat')
    })
  })
})
