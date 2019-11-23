/* eslint-env mocha */

const assert = require('assert')
const stream = require('stream')

const pify = require('pify')
const util = require('./_util')
const multer = require('../')
const FormData = require('form-data')
const testData = require('testdata-w3c-json-form')
const recursiveNullify = require('recursive-nullify')

describe('body', () => {
  let parser

  before(() => {
    parser = multer().none()
  })

  it('should process multiple fields', async () => {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('key', 'value')
    form.append('abc', 'xyz')

    const req = await util.submitForm(parser, form)

    assert.deepStrictEqual(req.body, recursiveNullify({
      name: 'Multer',
      key: 'value',
      abc: 'xyz'
    }))
  })

  it('should process empty fields', async () => {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('key', '')
    form.append('abc', '')
    form.append('checkboxfull', 'cb1')
    form.append('checkboxfull', 'cb2')
    form.append('checkboxhalfempty', 'cb1')
    form.append('checkboxhalfempty', '')
    form.append('checkboxempty', '')
    form.append('checkboxempty', '')

    const req = await util.submitForm(parser, form)

    assert.deepStrictEqual(req.body, recursiveNullify({
      name: 'Multer',
      key: '',
      abc: '',
      checkboxfull: [ 'cb1', 'cb2' ],
      checkboxhalfempty: [ 'cb1', '' ],
      checkboxempty: [ '', '' ]
    }))
  })

  it('should not process non-multipart POST request', async () => {
    const req = new stream.PassThrough()

    req.end('name=Multer')
    req.method = 'POST'
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    }

    await pify(parser)(req, null)

    assert.strictEqual(req.hasOwnProperty('body'), false)
    assert.strictEqual(req.hasOwnProperty('files'), false)
  })

  it('should not process non-multipart GET request', async () => {
    const req = new stream.PassThrough()

    req.end('name=Multer')
    req.method = 'GET'
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    }

    await pify(parser)(req, null)

    assert.strictEqual(req.hasOwnProperty('body'), false)
    assert.strictEqual(req.hasOwnProperty('files'), false)
  })

  for (const test of testData) {
    it(`should handle ${test.name}`, async () => {
      const form = new FormData()

      for (const field of test.fields) {
        form.append(field.key, field.value)
      }

      const req = await util.submitForm(parser, form)

      assert.deepStrictEqual(req.body, recursiveNullify(test.expected))
    })
  }

  it('should convert arrays into objects', async () => {
    const form = new FormData()

    form.append('obj[0]', 'a')
    form.append('obj[2]', 'c')
    form.append('obj[x]', 'yz')

    const req = await util.submitForm(parser, form)

    assert.deepStrictEqual(req.body, recursiveNullify({
      obj: {
        '0': 'a',
        '2': 'c',
        'x': 'yz'
      }
    }))
  })
})
