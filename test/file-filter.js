/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

function withFilter (fileFilter) {
  return multer({ fileFilter: fileFilter })
}

function skipSpecificFile (req, file, cb) {
  cb(null, file.fieldname !== 'notme')
}

function reportFakeError (req, file, cb) {
  cb(new Error('Fake error'))
}

describe('File Filter', function () {
  it('should skip some files', function (done) {
    var form = new FormData()
    var upload = withFilter(skipSpecificFile)
    var parser = upload.fields([
      { name: 'notme', maxCount: 1 },
      { name: 'butme', maxCount: 1 }
    ])

    form.append('notme', util.file('tiny0.dat'))
    form.append('butme', util.file('tiny1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.files.notme, undefined)
      assert.strictEqual(req.files.butme[0].fieldname, 'butme')
      assert.strictEqual(req.files.butme[0].originalname, 'tiny1.dat')
      assert.strictEqual(req.files.butme[0].size, 7)
      assert.strictEqual(req.files.butme[0].buffer.length, 7)
      done()
    })
  })

  it('should report errors from fileFilter', function (done) {
    var form = new FormData()
    var upload = withFilter(reportFakeError)
    var parser = upload.single('test')

    form.append('test', util.file('tiny0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.strictEqual(err.message, 'Fake error')
      done()
    })
  })
})
