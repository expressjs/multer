/* eslint-env mocha */

var assert = require('assert')
var stream = require('stream')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Fields', function () {
  var parser

  before(function () {
    parser = multer({ storage: multer.memoryStorage() })
  })

  it('should process multiple fields', function (done) {
    var form = new FormData()

    form.append('name', 'Multer')
    form.append('key', 'value')
    form.append('abc', 'xyz')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.deepEqual(req.body, {
        name: 'Multer',
        key: 'value',
        abc: 'xyz'
      })
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
      assert.deepEqual(req.body, {
        name: 'Multer',
        key: '',
        abc: '',
        checkboxfull: [ 'cb1', 'cb2' ],
        checkboxhalfempty: [ 'cb1', '' ],
        checkboxempty: [ '', '' ]
      })
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
      assert.equal(req.hasOwnProperty('body'), false)
      assert.equal(req.hasOwnProperty('files'), false)
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
      assert.equal(req.hasOwnProperty('body'), false)
      assert.equal(req.hasOwnProperty('files'), false)
      done()
    })
  })

})
