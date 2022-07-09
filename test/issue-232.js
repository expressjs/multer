/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var temp = require('fs-temp')
var rimraf = require('rimraf')
var FormData = require('form-data')

describe('Issue #232', function () {
  var uploadDir, upload

  before(function (done) {
    temp.mkdir(function (err, path) {
      if (err) return done(err)

      uploadDir = path
      upload = multer({ dest: path, limits: { fileSize: 100 } })
      done()
    })
  })

  after(function (done) {
    rimraf(uploadDir, done)
  })

  it('should report limit errors', function (done) {
    var form = new FormData()
    var parser = upload.single('file')

    form.append('file', util.file('large.jpg'))

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'an error was given')

      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')
      assert.strictEqual(err.field, 'file')

      done()
    })
  })
})
