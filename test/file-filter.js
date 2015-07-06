/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('File Filter', function () {
  var upload

  before(function () {
    upload = multer({
      fileFilter: function (req, file, cb) {
        cb(null, file.fieldname !== 'notme')
      }
    })
  })

  it('should skip some files', function (done) {
    var form = new FormData()
    var parser = upload.fields([
      { name: 'notme', maxCount: 1 },
      { name: 'butme', maxCount: 1 }
    ])

    form.append('notme', util.file('tiny0.dat'))
    form.append('butme', util.file('tiny1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.equal(req.files['notme'], undefined)
      assert.equal(req.files['butme'][0].fieldname, 'butme')
      assert.equal(req.files['butme'][0].originalname, 'tiny1.dat')
      assert.equal(req.files['butme'][0].size, 7)
      assert.equal(req.files['butme'][0].buffer.length, 7)
      done()
    })
  })

})
