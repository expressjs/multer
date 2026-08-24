/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

function submitFile (parser, filepath, cb) {
  var form = new FormData()

  form.append('file', util.file('tiny0.dat'), { filepath: filepath })

  util.submitForm(parser, form, cb)
}

describe('Preserve Path', function () {
  it('should strip the path by default', function (done) {
    submitFile(multer().single('file'), 'a/b/c.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.file.fieldname, 'file')
      assert.strictEqual(req.file.originalname, 'c.txt')

      done()
    })
  })

  it('should keep the full path when enabled', function (done) {
    var parser = multer({ preservePath: true }).single('file')

    submitFile(parser, 'a/b/c.txt', function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.file.fieldname, 'file')
      assert.strictEqual(req.file.originalname, 'a/b/c.txt')

      done()
    })
  })
})
