/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

describe('Misc', function () {
  it('should handle unicode filenames', function () {
    var form = new FormData()
    var parser = multer().single('file')
    var filename = '\ud83d\udca9.dat'

    form.append('file', util.file('small'), { filename: filename })

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.file.originalName, filename)

      // Ignore content
      req.file.stream.resume()
    })
  })

  it('should present files in same order as they came', function () {
    var parser = multer().array('themFiles', 2)
    var form = new FormData()

    form.append('themFiles', util.file('small'))
    form.append('themFiles', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.files.length, 2)

      util.assertFiles([
        [req.files[0], 'themFiles', 'small'],
        [req.files[1], 'themFiles', 'tiny']
      ])
    })
  })

  it('should accept multiple requests', function () {
    var parser = multer().array('them-files')

    function submitData (fileCount) {
      var form = new FormData()

      for (var i = 0; i < fileCount; i++) {
        form.append('them-files', util.file('small'))
      }

      return util.submitForm(parser, form).then(function (req) {
        assert.equal(req.files.length, fileCount)

        return util.assertFiles(req.files.map(function (file) {
          return [file, 'them-files', 'small']
        }))
      })
    }

    return Promise.all([9, 1, 5, 7, 2, 8, 3, 4].map(submitData))
  })
})
