/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Memory Storage', function () {
  it('should process multipart/form-data POST request', function () {
    var form = new FormData()
    var parser = multer().single('small0')

    form.append('name', 'Multer')
    form.append('small0', util.file('small0.dat'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.equal(req.file.fieldName, 'small0')
      assert.equal(req.file.originalName, 'small0.dat')
      assert.equal(req.file.size, 1778)

      return util.assertStreamSize(req.file.stream, 1778)
    })
  })

  it('should process empty fields and an empty file', function () {
    var form = new FormData()
    var parser = multer().single('empty')

    form.append('empty', util.file('empty.dat'))
    form.append('name', 'Multer')
    form.append('version', '')
    form.append('year', '')
    form.append('checkboxfull', 'cb1')
    form.append('checkboxfull', 'cb2')
    form.append('checkboxhalfempty', 'cb1')
    form.append('checkboxhalfempty', '')
    form.append('checkboxempty', '')
    form.append('checkboxempty', '')

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')
      assert.equal(req.body.version, '')
      assert.equal(req.body.year, '')

      assert.deepEqual(req.body.checkboxfull, [ 'cb1', 'cb2' ])
      assert.deepEqual(req.body.checkboxhalfempty, [ 'cb1', '' ])
      assert.deepEqual(req.body.checkboxempty, [ '', '' ])

      assert.equal(req.file.fieldName, 'empty')
      assert.equal(req.file.originalName, 'empty.dat')
      assert.equal(req.file.size, 0)

      return util.assertStreamSize(req.file.stream, 0)
    })
  })

  it('should process multiple files', function () {
    var form = new FormData()
    var parser = multer().fields([
      { name: 'empty', maxCount: 1 },
      { name: 'tiny0', maxCount: 1 },
      { name: 'tiny1', maxCount: 1 },
      { name: 'small0', maxCount: 1 },
      { name: 'small1', maxCount: 1 },
      { name: 'medium', maxCount: 1 },
      { name: 'large', maxCount: 1 }
    ])

    form.append('empty', util.file('empty.dat'))
    form.append('tiny0', util.file('tiny0.dat'))
    form.append('tiny1', util.file('tiny1.dat'))
    form.append('small0', util.file('small0.dat'))
    form.append('small1', util.file('small1.dat'))
    form.append('medium', util.file('medium.dat'))
    form.append('large', util.file('large.jpg'))

    return util.submitForm(parser, form).then(function (req) {
      assert.deepEqual(req.body, {})

      assert.equal(req.files['empty'][0].fieldName, 'empty')
      assert.equal(req.files['empty'][0].originalName, 'empty.dat')
      assert.equal(req.files['empty'][0].size, 0)

      assert.equal(req.files['tiny0'][0].fieldName, 'tiny0')
      assert.equal(req.files['tiny0'][0].originalName, 'tiny0.dat')
      assert.equal(req.files['tiny0'][0].size, 122)

      assert.equal(req.files['tiny1'][0].fieldName, 'tiny1')
      assert.equal(req.files['tiny1'][0].originalName, 'tiny1.dat')
      assert.equal(req.files['tiny1'][0].size, 7)

      assert.equal(req.files['small0'][0].fieldName, 'small0')
      assert.equal(req.files['small0'][0].originalName, 'small0.dat')
      assert.equal(req.files['small0'][0].size, 1778)

      assert.equal(req.files['small1'][0].fieldName, 'small1')
      assert.equal(req.files['small1'][0].originalName, 'small1.dat')
      assert.equal(req.files['small1'][0].size, 315)

      assert.equal(req.files['medium'][0].fieldName, 'medium')
      assert.equal(req.files['medium'][0].originalName, 'medium.dat')
      assert.equal(req.files['medium'][0].size, 13196)

      assert.equal(req.files['large'][0].fieldName, 'large')
      assert.equal(req.files['large'][0].originalName, 'large.jpg')
      assert.equal(req.files['large'][0].size, 2413677)

      return Promise.all([
        util.assertStreamSize(req.files['empty'][0].stream, 0),
        util.assertStreamSize(req.files['tiny0'][0].stream, 122),
        util.assertStreamSize(req.files['tiny1'][0].stream, 7),
        util.assertStreamSize(req.files['small0'][0].stream, 1778),
        util.assertStreamSize(req.files['small1'][0].stream, 315),
        util.assertStreamSize(req.files['medium'][0].stream, 13196),
        util.assertStreamSize(req.files['large'][0].stream, 2413677)
      ])
    })
  })
})
