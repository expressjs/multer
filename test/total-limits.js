/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Total field size limit', function () {
  it('should accept all fields under the total limit', function (done) {
    var parser = multer({ limits: { totalFieldSize: 10 } }).any()
    var form = new FormData()

    form.append('f', util.file('tiny0.dat'))
    form.append('hi', 'there')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.deepStrictEqual({ ...req.body }, { hi: 'there' })
      assert.strictEqual(req.files.length, 1)
      done()
    })
  })

  it('should reject a field once the total limit is reached', function (done) {
    var parser = multer({ limits: { totalFieldSize: 10 } }).any()
    var form = new FormData()

    form.append('f', util.file('tiny0.dat'))
    form.append('hi', 'there')
    form.append('also', util.file('tiny0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'should have returned an error')
      assert.strictEqual(err.code, 'LIMIT_TOTAL_FIELD_SIZE')
      assert.deepStrictEqual({ ...req.body }, { hi: 'there' })
      assert.strictEqual(req.files.length, 1)
      done()
    })
  })

  it('should reject all subsequent fields once the total limit is reached', function (done) {
    var parser = multer({ limits: { totalFieldSize: 10 } }).any()
    var form = new FormData()

    form.append('f', util.file('tiny0.dat'))
    form.append('hi', 'there')
    form.append('also', util.file('tiny0.dat'))
    form.append('and', 'more')
    form.append('ignore', util.file('tiny0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'should have returned an error')
      assert.strictEqual(err.code, 'LIMIT_TOTAL_FIELD_SIZE')
      assert.deepStrictEqual({ ...req.body }, { hi: 'there' })
      assert.strictEqual(req.files.length, 1)
      done()
    })
  })
})

describe('Total file size limit', function () {
  it('should accept all files under the total limit', function (done) {
    var parser = multer({ limits: { totalFileSize: 150 } }).any()
    var form = new FormData()

    form.append('tiny0a', util.file('tiny0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.files.length, 1)
      done()
    })
  })

  it('should reject a file once the total limit is reached', function (done) {
    var parser = multer({ limits: { totalFileSize: 150 } }).any()
    var form = new FormData()

    form.append('tiny0a', util.file('tiny0.dat'))
    form.append('tiny0b', util.file('tiny0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'should have returned an error')
      assert.strictEqual(err.code, 'LIMIT_TOTAL_FILE_SIZE')
      assert.strictEqual(req.files.length, 1)
      done()
    })
  })

  it('should reject all subsequent files once the total limit is reached', function (done) {
    var parser = multer({ limits: { totalFileSize: 150 } }).any()
    var form = new FormData()

    form.append('tiny0a', util.file('tiny0.dat'))
    form.append('tiny0b', util.file('tiny0.dat'))
    form.append('tiny0c', util.file('tiny0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ok(err, 'should have returned an error')
      assert.strictEqual(err.code, 'LIMIT_TOTAL_FILE_SIZE')
      assert.strictEqual(req.files.length, 1)
      done()
    })
  })
})
