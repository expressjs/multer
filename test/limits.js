/* eslint-env mocha */

const assertRejects = require('assert-rejects')
const FormData = require('form-data')

const util = require('./_util')
const multer = require('../')

describe('limits', () => {
  it('should report limit errors', async () => {
    const form = new FormData()
    const parser = multer({ limits: { fileSize: 100 } }).single('file')

    form.append('file', util.file('large'))

    await assertRejects(
      util.submitForm(parser, form),
      (err) => err.code === 'LIMIT_FILE_SIZE' && err.field === 'file'
    )
  })
})
