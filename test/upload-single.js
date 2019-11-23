/* eslint-env mocha */

const assert = require('assert')
const assertRejects = require('assert-rejects')
const FormData = require('form-data')

const multer = require('../')
const util = require('./_util')

describe('upload.single', () => {
  let parser

  before(() => {
    parser = multer().single('file')
  })

  it('should accept single file', async () => {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    const req = await util.submitForm(parser, form)
    assert.strictEqual(req.body.name, 'Multer')

    await util.assertFile(req.file, 'file', 'small')
  })

  it('should reject multiple files', async () => {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('tiny'))
    form.append('file', util.file('tiny'))

    await assertRejects(
      util.submitForm(parser, form),
      (err) => err.code === 'LIMIT_FILE_COUNT' && err.field === 'file'
    )
  })

  it('should reject unexpected field', async () => {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('unexpected', util.file('tiny'))

    await assertRejects(
      util.submitForm(parser, form),
      (err) => err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'unexpected'
    )
  })
})
