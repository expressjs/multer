/* eslint-env mocha */

import assert from 'node:assert'
import FormData from 'form-data'

import * as util from './_util.js'
import multer from '../index.js'

describe('upload.none', () => {
  let parser

  before(() => {
    parser = multer().none()
  })

  it('should handle text fields', async () => {
    const form = new FormData()
    const parser = multer().none()

    form.append('foo', 'bar')
    form.append('test', 'yes')

    const req = await util.submitForm(parser, form)
    assert.strictEqual(req.file, undefined)
    assert.strictEqual(req.files, undefined)

    assert.strictEqual(req.body.foo, 'bar')
    assert.strictEqual(req.body.test, 'yes')
  })

  it('should reject single file', async () => {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    await assert.rejects(
      util.submitForm(parser, form),
      (err) => err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'file'
    )
  })

  it('should reject multiple files', async () => {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('file', util.file('tiny'))
    form.append('file', util.file('tiny'))

    await assert.rejects(
      util.submitForm(parser, form),
      (err) => err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'file'
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
