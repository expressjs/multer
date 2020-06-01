/* eslint-env mocha */

var assert = require('assert')
var deepEqual = require('deep-equal')
var stream = require('stream')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')
var testData = require('testdata-w3c-json-form')

describe('Fields', function () {
  var parser

  before(function () {
    parser = multer().fields([])
  })

  it('should process multiple fields', function (done) {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('key', 'value')
    form.append('abc', 'xyz')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert(deepEqual(req.body, {
        name: 'Multer',
        key: 'value',
        abc: 'xyz'
      }))
      done()
    })
  })

  it('should process empty fields', function (done) {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('key', '')
    form.append('abc', '')
    form.append('checkboxfull', 'cb1')
    form.append('checkboxfull', 'cb2')
    form.append('checkboxhalfempty', 'cb1')
    form.append('checkboxhalfempty', '')
    form.append('checkboxempty', '')
    form.append('checkboxempty', '')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert(deepEqual(req.body, {
        name: 'Multer',
        key: '',
        abc: '',
        checkboxfull: ['cb1', 'cb2'],
        checkboxhalfempty: ['cb1', ''],
        checkboxempty: ['', '']
      }))
      done()
    })
  })

  it('should not process non-multipart POST request', function (done) {
    var req = new stream.PassThrough()

    req.end('name=Multer')
    req.method = 'POST'
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    }

    parser(req, null, function (err) {
      assert.ifError(err)
      assert.strictEqual(Object.prototype.hasOwnProperty.call(req, 'body'), false)
      assert.strictEqual(Object.prototype.hasOwnProperty.call(req, 'files'), false)
      done()
    })
  })

  it('should not process non-multipart GET request', function (done) {
    var req = new stream.PassThrough()

    req.end('name=Multer')
    req.method = 'GET'
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    }

    parser(req, null, function (err) {
      assert.ifError(err)
      assert.strictEqual(Object.prototype.hasOwnProperty.call(req, 'body'), false)
      assert.strictEqual(Object.prototype.hasOwnProperty.call(req, 'files'), false)
      done()
    })
  })

  testData.forEach(function (test) {
    it('should handle ' + test.name, function (done) {
      var form = new FormData()

      test.fields.forEach(function (field) {
        form.append(field.key, field.value)
      })

      util.submitForm(parser, form, function (err, req) {
        assert.ifError(err)
        assert(deepEqual(req.body, test.expected))
        done()
      })
    })
  })

  it('should convert arrays into objects', function (done) {
    var form = new FormData()

    form.append('obj[0]', 'a')
    form.append('obj[2]', 'c')
    form.append('obj[x]', 'yz')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert(deepEqual(req.body, {
        obj: {
          0: 'a',
          2: 'c',
          x: 'yz'
        }
      }))
      done()
    })
  })
})
