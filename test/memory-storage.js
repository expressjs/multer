/* eslint-env mocha */

var assert = require('assert')
var deepEqual = require('deep-equal')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Memory Storage', function () {
  var upload

  before(function (done) {
    upload = multer()
    done()
  })

  it('should process multipart/form-data POST request', function (done) {
    var form = new FormData()
    var parser = upload.single('small0')

    form.append('name', 'Multer')
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.body.name, 'Multer')

      assert.strictEqual(req.file.fieldname, 'small0')
      assert.strictEqual(req.file.originalname, 'small0.dat')
      assert.strictEqual(req.file.size, 1778)
      assert.strictEqual(req.file.buffer.length, 1778)

      done()
    })
  })

  it('should process empty fields and an empty file', function (done) {
    var form = new FormData()
    var parser = upload.single('empty')

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

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.body.name, 'Multer')
      assert.strictEqual(req.body.version, '')
      assert.strictEqual(req.body.year, '')

      assert(deepEqual(req.body.checkboxfull, ['cb1', 'cb2']))
      assert(deepEqual(req.body.checkboxhalfempty, ['cb1', '']))
      assert(deepEqual(req.body.checkboxempty, ['', '']))

      assert.strictEqual(req.file.fieldname, 'empty')
      assert.strictEqual(req.file.originalname, 'empty.dat')
      assert.strictEqual(req.file.size, 0)
      assert.strictEqual(req.file.buffer.length, 0)
      assert.strictEqual(Buffer.isBuffer(req.file.buffer), true)

      done()
    })
  })

  it('should process multiple files', function (done) {
    var form = new FormData()
    var parser = upload.fields([
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

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert(deepEqual(req.body, {}))

      assert.strictEqual(req.files.empty[0].fieldname, 'empty')
      assert.strictEqual(req.files.empty[0].originalname, 'empty.dat')
      assert.strictEqual(req.files.empty[0].size, 0)
      assert.strictEqual(req.files.empty[0].buffer.length, 0)

      assert.strictEqual(req.files.tiny0[0].fieldname, 'tiny0')
      assert.strictEqual(req.files.tiny0[0].originalname, 'tiny0.dat')
      assert.strictEqual(req.files.tiny0[0].size, 122)
      assert.strictEqual(req.files.tiny0[0].buffer.length, 122)

      assert.strictEqual(req.files.tiny1[0].fieldname, 'tiny1')
      assert.strictEqual(req.files.tiny1[0].originalname, 'tiny1.dat')
      assert.strictEqual(req.files.tiny1[0].size, 7)
      assert.strictEqual(req.files.tiny1[0].buffer.length, 7)

      assert.strictEqual(req.files.small0[0].fieldname, 'small0')
      assert.strictEqual(req.files.small0[0].originalname, 'small0.dat')
      assert.strictEqual(req.files.small0[0].size, 1778)
      assert.strictEqual(req.files.small0[0].buffer.length, 1778)

      assert.strictEqual(req.files.small1[0].fieldname, 'small1')
      assert.strictEqual(req.files.small1[0].originalname, 'small1.dat')
      assert.strictEqual(req.files.small1[0].size, 315)
      assert.strictEqual(req.files.small1[0].buffer.length, 315)

      assert.strictEqual(req.files.medium[0].fieldname, 'medium')
      assert.strictEqual(req.files.medium[0].originalname, 'medium.dat')
      assert.strictEqual(req.files.medium[0].size, 13196)
      assert.strictEqual(req.files.medium[0].buffer.length, 13196)

      assert.strictEqual(req.files.large[0].fieldname, 'large')
      assert.strictEqual(req.files.large[0].originalname, 'large.jpg')
      assert.strictEqual(req.files.large[0].size, 2413677)
      assert.strictEqual(req.files.large[0].buffer.length, 2413677)

      done()
    })
  })
})
