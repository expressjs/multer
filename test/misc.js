/* eslint-env mocha */

const assert = require('assert')

const util = require('./_util')
const multer = require('../')
const FormData = require('form-data')

describe('Misc', () => {
  it('should handle unicode filenames', async () => {
    const form = new FormData()
    const parser = multer().single('file')
    const filename = '\ud83d\udca9.dat'

    form.append('file', util.file('small'), { filename: filename })

    const req = await util.submitForm(parser, form)
    assert.strictEqual(req.file.originalName, filename)

    // Ignore content
    req.file.stream.resume()
  })

  it('should handle absent filenames', async () => {
    const form = new FormData()
    const parser = multer().single('file')
    const stream = util.file('small')

    // Don't let FormData figure out a filename
    delete stream.fd
    delete stream.path

    form.append('file', stream, { knownLength: util.knownFileLength('small') })

    const req = await util.submitForm(parser, form)
    assert.strictEqual(req.file.originalName, undefined)

    // Ignore content
    req.file.stream.resume()
  })

  it('should present files in same order as they came', async () => {
    const parser = multer().array('themFiles', 2)
    const form = new FormData()

    form.append('themFiles', util.file('small'))
    form.append('themFiles', util.file('tiny'))

    const req = await util.submitForm(parser, form)
    assert.strictEqual(req.files.length, 2)

    util.assertFiles([
      [req.files[0], 'themFiles', 'small'],
      [req.files[1], 'themFiles', 'tiny']
    ])
  })

  it('should accept multiple requests', async () => {
    const parser = multer().array('them-files')

    async function submitData (fileCount) {
      const form = new FormData()

      for (let i = 0; i < fileCount; i++) {
        form.append('them-files', util.file('small'))
      }

      const req = await util.submitForm(parser, form)
      assert.strictEqual(req.files.length, fileCount)

      await util.assertFiles(req.files.map((file) => [file, 'them-files', 'small']))
    }

    await Promise.all([9, 1, 5, 7, 2, 8, 3, 4].map(submitData))
  })

  it('should give error on old options', () => {
    assert.throws(() => multer({ dest: '/tmp' }))
    assert.throws(() => multer({ storage: {} }))
    assert.throws(() => multer({ fileFilter: () => {} }))
  })
})
