/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Expected files', function () {
  var upload

  before(function (done) {
    upload = multer()
    done()
  })

  it('should reject single unexpected file', function (done) {
    var form = new FormData()
    var parser = upload.single('butme')

    form.append('notme', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(err.field, 'notme')
      done()
    })
  })

  it('should reject array of multiple files', function (done) {
    var form = new FormData()
    var parser = upload.array('butme', 4)

    form.append('notme', util.file('small0.dat'))
    form.append('notme', util.file('small1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(err.field, 'notme')
      done()
    })
  })

  it('should reject overflowing arrays', function (done) {
    var form = new FormData()
    var parser = upload.array('butme', 1)

    form.append('butme', util.file('small0.dat'))
    form.append('butme', util.file('small1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(err.field, 'butme')
      done()
    })
  })

  it('should accept files with expected fieldname', function (done) {
    var form = new FormData()
    var parser = upload.fields([
      { name: 'butme', maxCount: 2 },
      { name: 'andme', maxCount: 2 }
    ])

    form.append('butme', util.file('small0.dat'))
    form.append('butme', util.file('small1.dat'))
    form.append('andme', util.file('empty.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.files['butme'].length, 2)
      assert.equal(req.files['andme'].length, 1)

      done()
    })
  })

  it('should reject files with unexpected fieldname', function (done) {
    var form = new FormData()
    var parser = upload.fields([
      { name: 'butme', maxCount: 2 },
      { name: 'andme', maxCount: 2 }
    ])

    form.append('butme', util.file('small0.dat'))
    form.append('butme', util.file('small1.dat'))
    form.append('andme', util.file('empty.dat'))
    form.append('notme', util.file('empty.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(err.field, 'notme')
      done()
    })
  })

  it('should accept files with matching fieldnames', function (done) {
    var form = new FormData()
    var parser = upload.matches(/^butme_\d$/, 5)

    form.append('butme_0', util.file('small0.dat'))
    form.append('butme_1', util.file('small1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.files['butme_0'][0].originalname, 'small0.dat')
      assert.equal(req.files['butme_1'][0].originalname, 'small1.dat')
      done()
    })
  })

  it('should reject files with non-matching fieldnames', function (done) {
    var form = new FormData()
    var parser = upload.matches(/^butme_\d$/, 5)

    form.append('notme_0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(err.field, 'notme_0')
      done()
    })
  })

  it('should reject too many files with matching fieldnames', function (done) {
    var form = new FormData()
    var parser = upload.matches(/^butme_\d$/, 1)

    form.append('butme_0', util.file('small0.dat'))
    form.append('butme_1', util.file('small1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(err.field, 'butme_1')
      done()
    })
  })
})
