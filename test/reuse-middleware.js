/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Reuse Middleware', function () {
  it('should accept multiple requests', function () {
    var parser = multer().array('them-files')

    function submitData (fileCount) {
      var form = new FormData()

      form.append('name', 'Multer')
      form.append('files', String(fileCount))

      for (var i = 0; i < fileCount; i++) {
        form.append('them-files', util.file('small0.dat'))
      }

      return util.submitForm(parser, form).then(function (req) {
        assert.equal(req.body.name, 'Multer')
        assert.equal(req.body.files, String(fileCount))
        assert.equal(req.files.length, fileCount)

        req.files.forEach(function (file) {
          assert.equal(file.fieldName, 'them-files')
          assert.equal(file.originalName, 'small0.dat')
          assert.equal(file.size, 1778)
        })

        return Promise.all(req.files.map(function (file) {
          return util.assertStreamSize(file.stream, 1778)
        }))
      })
    }

    return Promise.all([
      submitData(9),
      submitData(1),
      submitData(5),
      submitData(7),
      submitData(2),
      submitData(8),
      submitData(3),
      submitData(4)
    ])
  })
})
