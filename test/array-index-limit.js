/* eslint-env mocha */

import assert from 'node:assert'

import FormData from 'form-data'

import * as util from './_util.js'
import multer from '../index.js'

describe('Field name array index limit', () => {
  it('should accept an index at the default limit', async () => {
    const parser = multer().none()
    const form = new FormData()

    form.append('items[1000]', 'value')

    const req = await util.submitForm(parser, form)

    assert.strictEqual(req.body.items[1000], 'value')
  })

  it('should reject an index above the default limit', async () => {
    const parser = multer().none()
    const form = new FormData()

    form.append('items[1001]', 'value')

    await assert.rejects(util.submitForm(parser, form), (err) => {
      return err.code === 'LIMIT_FIELD_ARRAY_INDEX' && err.field === 'items[1001]'
    })
  })

  it('should honor an explicit fieldArrayIndexLimit above the default', async () => {
    const parser = multer({ limits: { fieldArrayIndexLimit: 2000 } }).none()
    const form = new FormData()

    form.append('items[1001]', 'value')

    const req = await util.submitForm(parser, form)

    assert.strictEqual(req.body.items[1001], 'value')
  })

  it('should not treat a literal fallback key as an array index', async () => {
    const parser = multer().none()
    const form = new FormData()

    form.append('items[1000]tail', 'value')

    const req = await util.submitForm(parser, form)

    assert.strictEqual(req.body['items[1000]tail'], 'value')
  })

  it('should reject an oversized index nested behind object keys', async () => {
    const parser = multer({ limits: { fieldArrayIndexLimit: 10 } }).none()
    const form = new FormData()

    form.append('a[b][c][99999]', 'value')

    await assert.rejects(util.submitForm(parser, form), (err) => err.code === 'LIMIT_FIELD_ARRAY_INDEX')
  })

  it('should allow an index at exactly an explicit limit', async () => {
    const parser = multer({ limits: { fieldArrayIndexLimit: 5 } }).none()
    const form = new FormData()

    form.append('a[5]', 'value')

    const req = await util.submitForm(parser, form)

    assert.strictEqual(req.body.a.length, 6)
    assert.strictEqual(req.body.a[5], 'value')
  })

  it('should leave object keys alone', async () => {
    const parser = multer({ limits: { fieldArrayIndexLimit: 0 } }).none()
    const form = new FormData()

    form.append('a[99999999x]', 'value')

    const req = await util.submitForm(parser, form)

    assert.strictEqual(req.body.a['99999999x'], 'value')
  })

  it('should allow a nested array index within the limit', async () => {
    const parser = multer({ limits: { fieldArrayIndexLimit: 100 } }).none()
    const form = new FormData()

    form.append('a[b][3]', 'value')

    const req = await util.submitForm(parser, form)

    assert.strictEqual(req.body.a.b[3], 'value')
  })
})
