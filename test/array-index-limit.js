/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Field name array index limit', function () {
  // @see https://github.com/expressjs/multer/security/advisories/GHSA-cf2x-4m44-rv66

  it('should reject an array index above fieldArrayIndexLimit', function (done) {
    var parser = multer({ limits: { fieldArrayIndexLimit: 1000 } }).none()
    var form = new FormData()

    form.append('a[4294967294]', 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'should have returned an error')
      assert.strictEqual(err.code, 'LIMIT_FIELD_ARRAY_INDEX')
      assert.strictEqual(err.field, 'a[4294967294]')
      done()
    })
  })

  it('should reject an oversized index nested behind object keys', function (done) {
    var parser = multer({ limits: { fieldArrayIndexLimit: 10 } }).none()
    var form = new FormData()

    form.append('a[b][c][99999]', 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'should have returned an error')
      assert.strictEqual(err.code, 'LIMIT_FIELD_ARRAY_INDEX')
      done()
    })
  })

  it('should allow an index at exactly the limit', function (done) {
    var parser = multer({ limits: { fieldArrayIndexLimit: 5 } }).none()
    var form = new FormData()

    form.append('a[5]', 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.body.a.length, 6)
      done()
    })
  })

  it('should bound a numeric key even when the limit is zero', function (done) {
    var parser = multer({ limits: { fieldArrayIndexLimit: 0 } }).none()
    var form = new FormData()

    form.append('a[99999999]', 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'a numeric key should still be bounded at zero')
      assert.strictEqual(err.code, 'LIMIT_FIELD_ARRAY_INDEX')
      done()
    })
  })

  it('should leave object keys alone', function (done) {
    var parser = multer({ limits: { fieldArrayIndexLimit: 0 } }).none()
    var form = new FormData()

    form.append('a[99999999x]', 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.body.a['99999999x'], 'value')
      done()
    })
  })

  it('should be unbounded when the limit is not set', function (done) {
    var parser = multer({ limits: {} }).none()
    var form = new FormData()

    form.append('a[4294967294]', 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.body.a.length, 4294967295)
      done()
    })
  })
})
