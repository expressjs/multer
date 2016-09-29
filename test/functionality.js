/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Functionality', function () {
  it('should upload the file', function () {
    var form = new FormData()
    var parser = multer().single('small0')

    form.append('small0', util.file('small0.dat'))

    return util.submitForm(parser, form).then(function (req) {
      return util.assertStreamSize(req.file.stream, 1778)
    })
  })

  it('should ensure req.files points to an array', function () {
    var form = new FormData()
    var parser = multer().any()

    form.append('firstFile', util.file('small0.dat'))
    form.append('secondFile', util.file('small1.dat'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files.length, 2)

      assert.equal(req.files[0].fieldName, 'firstFile')
      assert.equal(req.files[0].originalName, 'small0.dat')
      assert.equal(req.files[0].size, 1778)

      assert.equal(req.files[1].fieldName, 'secondFile')
      assert.equal(req.files[1].originalName, 'small1.dat')
      assert.equal(req.files[1].size, 315)

      return Promise.all([
        util.assertStreamSize(req.files[0].stream, 1778),
        util.assertStreamSize(req.files[1].stream, 315)
      ])
    })
  })

  it('should ensure all req.files values (multi-files per field) point to an array', function () {
    var form = new FormData()
    var parser = multer().array('themFiles', 2)

    form.append('themFiles', util.file('small0.dat'))
    form.append('themFiles', util.file('small1.dat'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files.length, 2)

      assert.equal(req.files[0].fieldName, 'themFiles')
      assert.equal(req.files[0].originalName, 'small0.dat')
      assert.equal(req.files[0].size, 1778)

      assert.equal(req.files[1].fieldName, 'themFiles')
      assert.equal(req.files[1].originalName, 'small1.dat')
      assert.equal(req.files[1].size, 315)

      return Promise.all([
        util.assertStreamSize(req.files[0].stream, 1778),
        util.assertStreamSize(req.files[1].stream, 315)
      ])
    })
  })
})
