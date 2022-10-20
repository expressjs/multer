/* eslint-env mocha */

import assert from 'node:assert'
import FormData from 'form-data'

import * as util from './_util.js'
import multer from '../index.js'

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

    await assert.rejects(
      util.submitForm(parser, form),
      (err) => err.code === 'LIMIT_FILE_COUNT' && err.field === 'file'
    )
  })

  it('should reject unexpected field', async () => {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('unexpected', util.file('tiny'))

    await assert.rejects(
      util.submitForm(parser, form),
      (err) => err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'unexpected'
    )
  })

  it('should disable detection', async () => {
    const parser = multer({ disableDetection: true }).fields([
      { name: 'set-1', maxCount: 1 }
    ])

    const form = new FormData()
    form.append('set-1', util.file('medium'))

    const req = await util.submitForm(parser, form)
    await util.assertFile(req.files['set-1'][0], 'set-1', 'medium', { disableDetection: true })
  })
})
