/* eslint-env mocha */

import assert from 'node:assert'
import FormData from 'form-data'

import * as util from './_util.js'
import multer from '../index.js'

describe('upload.any', () => {
  let parser

  before(() => {
    parser = multer().any()
  })

  it('should accept single file', async () => {
    const form = new FormData()

    form.append('test', util.file('tiny'))

    const req = await util.submitForm(parser, form)
    assert.strictEqual(req.files.length, 1)

    await util.assertFile(req.files[0], 'test', 'tiny')
  })

  it('should accept some files', async () => {
    const form = new FormData()

    form.append('foo', util.file('empty'))
    form.append('foo', util.file('small'))
    form.append('test', util.file('empty'))
    form.append('anyname', util.file('tiny'))

    const req = await util.submitForm(parser, form)
    assert.strictEqual(req.files.length, 4)

    await util.assertFiles([
      [req.files[0], 'foo', 'empty'],
      [req.files[1], 'foo', 'small'],
      [req.files[2], 'test', 'empty'],
      [req.files[3], 'anyname', 'tiny']
    ])
  })

  it('should accept any files', async () => {
    const form = new FormData()

    form.append('set-0', util.file('empty'))
    form.append('set-1', util.file('tiny'))
    form.append('set-0', util.file('empty'))
    form.append('set-1', util.file('tiny'))
    form.append('set-2', util.file('tiny'))
    form.append('set-1', util.file('tiny'))
    form.append('set-2', util.file('empty'))

    const req = await util.submitForm(parser, form)
    assert.strictEqual(req.files.length, 7)

    await util.assertFiles([
      [req.files[0], 'set-0', 'empty'],
      [req.files[1], 'set-1', 'tiny'],
      [req.files[2], 'set-0', 'empty'],
      [req.files[3], 'set-1', 'tiny'],
      [req.files[4], 'set-2', 'tiny'],
      [req.files[5], 'set-1', 'tiny'],
      [req.files[6], 'set-2', 'empty']
    ])
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
