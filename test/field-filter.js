/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

function withFilter (fieldFilter) {
  return multer({ fieldFilter: fieldFilter })
}

function skipSpecificField (req, fieldname, value, cb) {
  cb(null, fieldname !== 'notme' && value !== 'notme')
}

function reportFakeError (req, fieldname, value, cb) {
  cb(new Error('Fake error'))
}

describe('Field Filter', function () {
  it('should skip some fields', function (done) {
    var form = new FormData()
    var upload = withFilter(skipSpecificField)
    var parser = upload.any()

    form.append('notme', 'notme')
    form.append('butme', 'butme')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.equal(req.body['notme'], undefined)
      assert.equal(req.body['butme'], 'butme')
      done()
    })
  })

  it('should report errors from fieldFilter', function (done) {
    var form = new FormData()
    var upload = withFilter(reportFakeError)
    var parser = upload.single('test')

    form.append('test', util.file('tiny0.dat'))
    form.append('field', 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.message, 'Fake error')
      done()
    })
  })
})
