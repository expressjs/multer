/* eslint-env mocha */

const assert = require('assert')

const util = require('./_util')
const multer = require('../')
const FormData = require('form-data')

describe('Misc', function () {
  it('should handle unicode filenames', function () {
    const form = new FormData()
    const parser = multer().single('file')
    const filename = '\ud83d\udca9.dat'

    form.append('file', util.file('small'), { filename: filename })

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.file.originalName, filename)

      // Ignore content
      req.file.stream.resume()
    })
  })

  it('should handle absent filenames', function () {
    const form = new FormData()
    const parser = multer().single('file')
    const stream = util.file('small')

    // Don't let FormData figure out a filename
    delete stream.fd
    delete stream.path

    form.append('file', stream, { knownLength: util.knownFileLength('small') })

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.file.originalName, undefined)

      // Ignore content
      req.file.stream.resume()
    })
  })

  it('should present files in same order as they came', function () {
    const parser = multer().array('themFiles', 2)
    const form = new FormData()

    form.append('themFiles', util.file('small'))
    form.append('themFiles', util.file('tiny'))

    return util.submitForm(parser, form).then(function (req) {
      assert.strictEqual(req.files.length, 2)

      util.assertFiles([
        [req.files[0], 'themFiles', 'small'],
        [req.files[1], 'themFiles', 'tiny']
      ])
    })
  })

  it('should accept multiple requests', function () {
    const parser = multer().array('them-files')

    function submitData (fileCount) {
      const form = new FormData()

      for (let i = 0; i < fileCount; i++) {
        form.append('them-files', util.file('small'))
      }

      return util.submitForm(parser, form).then(function (req) {
        assert.strictEqual(req.files.length, fileCount)

        return util.assertFiles(req.files.map(function (file) {
          return [file, 'them-files', 'small']
        }))
      })
    }

    return Promise.all([9, 1, 5, 7, 2, 8, 3, 4].map(submitData))
  })

  it('should give error on old options', function () {
    assert.throws(function () {
      multer({ dest: '/tmp' })
    })

    assert.throws(function () {
      multer({ storage: {} })
    })

    assert.throws(function () {
      multer({ fileFilter: function () {} })
    })
  })
})
