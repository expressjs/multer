/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var onFinished = require('on-finished')
var path = require('path')

var multer = require('../')

describe('File with no filename', function () {
  var upload

  before(function () {
    upload = multer()
  })

  it('should accept file without filename', function (done) {
    var parser = upload.any()

    var filePath = path.join(__dirname, 'files', 'no-filename.dat')
    var req = fs.createReadStream(filePath)
    req.headers = {
      'content-type': 'multipart/form-data; boundary=99999',
      'content-length': fs.statSync(filePath).size
    }

    parser(req, null, function (err) {
      onFinished(req, function () {
        assert.ifError(err)
        assert.equal(req.files.length, 1)
        assert.equal(req.files[0].fieldname, 'fileField')
        assert.equal(req.files[0].buffer.toString(), 'foo')
        done()
      })
    })
  })
})
