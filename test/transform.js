/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')
var Throttle = require('stream-throttle').Throttle

describe('Transform stream', function () {
  var bps = 1500000
  var bytes = 2413677
  var duration = bytes * 1000 / bps
  this.timeout(1000 + duration)
  var upload

  before(function (done) {
    upload = multer({
      transform: new Throttle({rate: bps})
    })
    done()
  })

  it('should throttle file upload', function (done) {
    var form = new FormData()
    var start = Date.now()
    var parser = upload.fields([
      { name: 'large', maxCount: 1 }
    ])

    form.append('large', util.file('large.jpg'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.deepEqual(req.body, {})

      assert.equal(req.files['large'][0].fieldname, 'large')
      assert.equal(req.files['large'][0].originalname, 'large.jpg')
      assert.equal(req.files['large'][0].size, bytes)
      assert.equal(req.files['large'][0].buffer.length, bytes)
      var interval = Date.now() - start
      assert.ok(interval >= duration, 'Upload was too fast: ' + interval + ' < ' + duration)

      done()
    })
  })
})
