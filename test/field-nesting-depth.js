/* eslint-env mocha */

import assert from 'node:assert'

import FormData from 'form-data'

import * as util from './_util.js'
import multer from '../index.js'

describe('Field name nesting depth', () => {
  it('should reject field names exceeding fieldNestingDepth (array brackets)', async () => {
    const parser = multer({ limits: { fieldNestingDepth: 10 } }).none()
    const form = new FormData()

    form.append('a' + '[0]'.repeat(11), 'value')

    await assert.rejects(util.submitForm(parser, form), (err) => err.code === 'LIMIT_FIELD_NESTING')
  })

  it('should reject field names exceeding fieldNestingDepth (object brackets)', async () => {
    const parser = multer({ limits: { fieldNestingDepth: 10 } }).none()
    const form = new FormData()

    form.append('a' + '[key]'.repeat(11), 'value')

    await assert.rejects(util.submitForm(parser, form), (err) => err.code === 'LIMIT_FIELD_NESTING')
  })

  it('should allow field names at exactly the nesting depth limit', async () => {
    const parser = multer({ limits: { fieldNestingDepth: 3 } }).none()
    const form = new FormData()

    form.append('a[0][1][2]', 'value')

    const req = await util.submitForm(parser, form)

    assert.strictEqual(req.body.a[0][1][2], 'value')
  })

  it('should reject field names exceeding the default fieldNestingDepth', async () => {
    const parser = multer({ limits: { fieldNameSize: '10KB' } }).none()
    const form = new FormData()

    form.append('a' + '[0]'.repeat(33), 'value')

    await assert.rejects(util.submitForm(parser, form), (err) => err.code === 'LIMIT_FIELD_NESTING')
  })

  it('should allow deep nesting when opted in to a higher limit', async () => {
    const parser = multer({ limits: { fieldNameSize: '10KB', fieldNestingDepth: 1000 } }).none()
    const form = new FormData()

    form.append('a' + '[0]'.repeat(100), 'value')

    await util.submitForm(parser, form)
  })

  it('should allow flat field names with fieldNestingDepth set', async () => {
    const parser = multer({ limits: { fieldNestingDepth: 1 } }).none()
    const form = new FormData()

    form.append('simple', 'value')

    const req = await util.submitForm(parser, form)

    assert.strictEqual(req.body.simple, 'value')
  })
})
