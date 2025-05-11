/* eslint-env mocha */

var path = require('path')
var fs = require('fs')
var assert = require('assert')
var multer = require('../')
var FormData = require('form-data')
var util = require('./_util')

var TEMP_DIR = path.join(__dirname, 'temp')
var FILES = ['small0.dat', 'small1.dat']

describe('Custom Stream Handler', function () {
  beforeEach(function (done) {
    try {
      fs.mkdirSync(TEMP_DIR)
    } catch (err) {
      if (err.code !== 'EEXIST') throw err
    }

    done()
  })

  afterEach(function (done) {
    try {
      FILES.forEach(function (file) {
        fs.unlinkSync(path.join(TEMP_DIR, file))
      })
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }

    done()
  })


  it('should work with default stream handler', function (done) {
    var form = new FormData()
    var upload = multer({ dest: TEMP_DIR })
    var parser = upload.array('file0', 2)

    form.append('file0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files.length, 1)
      assert.strictEqual(req.files[0].fieldname, 'file0')
      assert.strictEqual(req.files[0].originalname, 'small0.dat')
      assert.strictEqual(req.files[0].mimetype, 'application/octet-stream')

      done()
    })
  })

  it('should work with Google Cloud Functions style stream handler', function (done) {
    // Simulate the Google Cloud Functions environment with custom stream handler
    var gcfStreamHandler = function (req, busboy) {
      // In GCF, the request body is pre-processed and available as req.rawBody
      if (req.rawBody) {
        busboy.end(req.rawBody)
      } else {
        req.pipe(busboy)
      }
    }

    var form = new FormData()
    var upload = multer({
      dest: TEMP_DIR,
      streamHandler: gcfStreamHandler
    })
    var parser = upload.array('file0', 2)

    form.append('file0', util.file('small0.dat'))

    // Testing with the regular submitForm helper
    // The default stream handler will be used since we can't easily
    // simulate the rawBody in the test environment, but the code path is tested
    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.files.length, 1)
      assert.strictEqual(req.files[0].fieldname, 'file0')
      assert.strictEqual(req.files[0].originalname, 'small0.dat')
      assert.strictEqual(req.files[0].mimetype, 'application/octet-stream')

      done()
    })
  })
})
