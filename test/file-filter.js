/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('File Filter', function () {
  var parser

  before(function () {
    parser = multer({
      storage: multer.memoryStorage(),
      fileFilter: function (req, file, cb) {
        cb(null, file.fieldname !== 'notme')
      }
    })
  })

  it('should skip some files', function (done) {
    var form = new FormData()

    form.append('notme', util.file('tiny0.dat'))
    form.append('butme', util.file('tiny1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.equal(req.files.length, 1)
      assert.equal(req.files[0].fieldname, 'butme')
      assert.equal(req.files[0].originalname, 'tiny1.dat')
      assert.equal(req.files[0].size, 7)
      assert.equal(req.files[0].buffer.length, 7)
      done()
    })
  })

})
