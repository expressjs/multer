/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Reuse Middleware', function () {
  var parser

  before(function (done) {
    parser = multer().array('them-files')
    done()
  })

  it('should accept multiple requests', function (done) {
    var pending = 8

    function submitData (fileCount) {
      var form = new FormData()

      form.append('name', 'Multer')
      form.append('files', '' + fileCount)

      for (var i = 0; i < fileCount; i++) {
        form.append('them-files', util.file('small0.dat'))
      }

      util.submitForm(parser, form, function (err, req) {
        assert.ifError(err)

        assert.equal(req.body.name, 'Multer')
        assert.equal(req.body.files, '' + fileCount)
        assert.equal(req.files.length, fileCount)

        req.files.forEach(function (file) {
          assert.equal(file.fieldname, 'them-files')
          assert.equal(file.originalname, 'small0.dat')
          assert.equal(file.size, 1778)
          assert.equal(file.buffer.length, 1778)
        })

        if (--pending === 0) done()
      })
    }

    submitData(9)
    submitData(1)
    submitData(5)
    submitData(7)
    submitData(2)
    submitData(8)
    submitData(3)
    submitData(4)
  })
})
