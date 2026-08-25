/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Field name nesting depth', function () {
  // @see https://github.com/expressjs/multer/security/advisories/GHSA-72gw-mp4g-v24j

  it('should reject field names exceeding fieldNestingDepth (array brackets)', function (done) {
    var parser = multer({ limits: { fieldNestingDepth: 10 } }).none()
    var form = new FormData()

    form.append('a' + '[0]'.repeat(11), 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'should have returned an error')
      assert.strictEqual(err.code, 'LIMIT_FIELD_NESTING')
      done()
    })
  })

  it('should reject field names exceeding fieldNestingDepth (object brackets)', function (done) {
    var parser = multer({ limits: { fieldNestingDepth: 10 } }).none()
    var form = new FormData()

    form.append('a' + '[key]'.repeat(11), 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'should have returned an error')
      assert.strictEqual(err.code, 'LIMIT_FIELD_NESTING')
      done()
    })
  })

  it('should allow field names at exactly the nesting depth limit', function (done) {
    var parser = multer({ limits: { fieldNestingDepth: 3 } }).none()
    var form = new FormData()

    form.append('a[0][1][2]', 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.body.a[0][1][2], 'value')
      done()
    })
  })

  it('should allow unlimited nesting by default', function (done) {
    var parser = multer().none()
    var form = new FormData()

    form.append('a' + '[0]'.repeat(100), 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      done()
    })
  })

  it('should allow flat field names with fieldNestingDepth set', function (done) {
    var parser = multer({ limits: { fieldNestingDepth: 1 } }).none()
    var form = new FormData()

    form.append('simple', 'value')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.body.simple, 'value')
      done()
    })
  })
})
