/* eslint-env mocha */

var assert = require('assert')
var deepEqual = require('deep-equal')
var path = require('path')
var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

function assertFileProperties (file, name) {
  const expectedSize = util.fileSizeByName(name)
  assert.strictEqual(file.fieldname, path.parse(name).name)
  assert.strictEqual(file.originalname, name)
  assert.strictEqual(file.size, expectedSize)
  assert.ok(Buffer.isBuffer(file.buffer))
  assert.strictEqual(file.buffer.length, expectedSize)
}

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

      assertFileProperties(req.file, 'small0.dat')

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

      assertFileProperties(req.file, 'empty.dat')

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

      assertFileProperties(req.files.empty[0], 'empty.dat')
      assertFileProperties(req.files.tiny0[0], 'tiny0.dat')
      assertFileProperties(req.files.tiny1[0], 'tiny1.dat')
      assertFileProperties(req.files.small0[0], 'small0.dat')
      assertFileProperties(req.files.small1[0], 'small1.dat')
      assertFileProperties(req.files.medium[0], 'medium.dat')
      assertFileProperties(req.files.large[0], 'large.jpg')

      done()
    })
  })
})
