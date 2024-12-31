/* eslint-env mocha */

var assert = require('assert')

var multer = require('../')
var temp = require('fs-temp')
var rimraf = require('rimraf')
var stream = require('stream')

describe('Unicode', function () {
  var uploadDir, upload

  beforeEach(function (done) {
    temp.mkdir(function (err, path) {
      if (err) return done(err)

      var storage = multer.diskStorage({
        destination: path,
        filename: function (req, file, cb) {
          cb(null, file.originalname)
        }
      })

      uploadDir = path
      upload = multer({ storage: storage })
      done()
    })
  })

  afterEach(function (done) {
    rimraf(uploadDir, done)
  })

  it('should handle unicode filenames', function (done) {
    var req = new stream.PassThrough()
    var boundary = 'AaB03x'
    var body = [
      '--' + boundary,
      'Content-Disposition: form-data; name="small0"; filename="poo.dat"; filename*=utf-8\'\'%F0%9F%92%A9.dat',
      'Content-Type: text/plain',
      '',
      'test with unicode filename',
      '--' + boundary + '--'
    ].join('\r\n')

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': body.length
    }

    req.end(body)

    upload.single('small0')(req, null, function (err) {
      assert.ifError(err)

      assert.strictEqual(req.file.originalname, '\ud83d\udca9.dat')
      assert.strictEqual(req.file.fieldname, 'small0')

      done()
    })
  })
})
