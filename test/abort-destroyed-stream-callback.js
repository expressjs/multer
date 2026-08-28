/* eslint-env mocha */

var stream = require('stream')

var multer = require('../')
var rimraf = require('rimraf')
var temp = require('fs-temp')

// @see https://github.com/expressjs/multer/security/advisories/GHSA-qfvm-cv95-jqjf

describe('disk storage _handleFile with an already-destroyed source stream', function () {
  var uploadDir

  beforeEach(function (done) {
    temp.mkdir(function (err, dir) {
      if (err) return done(err)
      uploadDir = dir
      done()
    })
  })

  afterEach(function (done) {
    rimraf(uploadDir, done)
  })

  it('should always invoke the callback', function (done) {
    this.timeout(2000)

    var storage = multer.diskStorage({ destination: uploadDir })

    var source = new stream.PassThrough()
    source.destroy()

    var file = {
      fieldname: 'file',
      originalname: 'destroyed.bin',
      stream: source
    }

    // If the callback is never invoked (the pre-write guard returning without
    // settling), mocha fails this test with a timeout. A double invocation is
    // caught by mocha's "done() called multiple times".
    storage._handleFile({}, file, function () {
      done()
    })
  })
})
