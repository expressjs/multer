/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

function generateForm () {
  var form = new FormData()

  form.append('CA$|-|', util.file('empty.dat'))
  form.append('set-1', util.file('tiny0.dat'))
  form.append('set-1', util.file('empty.dat'))
  form.append('set-1', util.file('tiny1.dat'))
  form.append('set-2', util.file('tiny1.dat'))
  form.append('set-2', util.file('tiny0.dat'))
  form.append('set-2', util.file('empty.dat'))

  return form
}

function assertSet (files, setName, fileNames) {
  var i, len = fileNames.length

  assert.equal(files.length, len)

  for (i = 0; i < len; i++) {
    assert.equal(files[i].fieldname, setName)
    assert.equal(files[i].originalname, fileNames[i])
  }
}

describe('Memory Storage', function () {
  var parser

  before(function () {
    parser = multer({ storage: multer.memoryStorage() })
  })

  it('should select the first file with fieldname', function (done) {
    util.submitForm(parser, generateForm(), function (err, req) {
      assert.ifError(err)
      assert.equal(req.files.length, 7)

      var file

      file = multer.one(req.files, 'CA$|-|')
      assert.equal(file.fieldname, 'CA$|-|')
      assert.equal(file.originalname, 'empty.dat')

      file = multer.one(req.files, 'set-1')
      assert.equal(file.fieldname, 'set-1')
      assert.equal(file.originalname, 'tiny0.dat')

      file = multer.one(req.files, 'set-2')
      assert.equal(file.fieldname, 'set-2')
      assert.equal(file.originalname, 'tiny1.dat')

      done()
    })

  })

  it('should select all files with fieldname', function (done) {
    util.submitForm(parser, generateForm(), function (err, req) {
      assert.ifError(err)
      assert.equal(req.files.length, 7)

      var files

      files = multer.many(req.files, 'CA$|-|')
      assertSet(files, 'CA$|-|', [ 'empty.dat' ])

      files = multer.many(req.files, 'set-1')
      assertSet(files, 'set-1', [ 'tiny0.dat', 'empty.dat', 'tiny1.dat' ])

      files = multer.many(req.files, 'set-2')
      assertSet(files, 'set-2', [ 'tiny1.dat', 'tiny0.dat', 'empty.dat' ])

      done()
    })

  })

})
