/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')
var assertRejects = require('assert-rejects')

describe('Expected files', function () {
  var upload

  before(function (done) {
    upload = multer()
    done()
  })

  it('should reject single unexpected file', function () {
    var form = new FormData()
    var parser = upload.single('butme')

    form.append('notme', util.file('small0.dat'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.equal(err.field, 'notme')

        return true
      }
    )
  })

  it('should reject array of multiple files', function () {
    var form = new FormData()
    var parser = upload.array('butme', 4)

    form.append('notme', util.file('small0.dat'))
    form.append('notme', util.file('small1.dat'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.equal(err.field, 'notme')

        return true
      }
    )
  })

  it('should reject overflowing arrays', function () {
    var form = new FormData()
    var parser = upload.array('butme', 1)

    form.append('butme', util.file('small0.dat'))
    form.append('butme', util.file('small1.dat'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.equal(err.field, 'butme')

        return true
      }
    )
  })

  it('should accept files with expected fieldname', function () {
    var form = new FormData()
    var parser = upload.fields([
      { name: 'butme', maxCount: 2 },
      { name: 'andme', maxCount: 2 }
    ])

    form.append('butme', util.file('small0.dat'))
    form.append('butme', util.file('small1.dat'))
    form.append('andme', util.file('empty.dat'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files['butme'].length, 2)
      assert.equal(req.files['andme'].length, 1)
    })
  })

  it('should reject files with unexpected fieldname', function () {
    var form = new FormData()
    var parser = upload.fields([
      { name: 'butme', maxCount: 2 },
      { name: 'andme', maxCount: 2 }
    ])

    form.append('butme', util.file('small0.dat'))
    form.append('butme', util.file('small1.dat'))
    form.append('andme', util.file('empty.dat'))
    form.append('notme', util.file('empty.dat'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.equal(err.field, 'notme')

        return true
      }
    )
  })

  it('should allow any file to come thru', function () {
    var form = new FormData()
    var parser = upload.any()

    form.append('butme', util.file('small0.dat'))
    form.append('butme', util.file('small1.dat'))
    form.append('andme', util.file('empty.dat'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files.length, 3)
      assert.equal(req.files[0].fieldName, 'butme')
      assert.equal(req.files[1].fieldName, 'butme')
      assert.equal(req.files[2].fieldName, 'andme')
    })
  })
})
