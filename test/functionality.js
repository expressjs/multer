/* eslint-env mocha */

var assert = require('assert')
var FormData = require('form-data')
var fs = require('fs-temp/promise')

var multer = require('../')
var util = require('./_util')
var path = require('path')

describe('Functionality', function () {
  var parser
  var uploadDir

  before(function () {
    return fs.mkdir().then(function (dir) {
      uploadDir = dir
    })
  })

  it('should upload the file to the `dest` dir', function () {
    var form = new FormData()

    parser = multer({dest: uploadDir}).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.file)
      assert.equal(req.file.fieldName, 'file')
      assert.equal(req.file.originalName, 'small.dat')
      assert.equal(path.dirname(req.file.path), uploadDir)
    })
  })

  it('should upload using a string argument as the `dest` dir', function () {
    var form = new FormData()

    parser = multer(uploadDir).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.file)
      assert.equal(req.file.fieldName, 'file')
      assert.equal(req.file.originalName, 'small.dat')
      assert.equal(path.dirname(req.file.path), uploadDir)
    })
  })
})
