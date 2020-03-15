/* eslint-env mocha */

const assert = require('assert')
const assertRejects = require('assert-rejects')
const FormData = require('form-data')
const pify = require('pify')
const stream = require('stream')

const util = require('./_util')
const multer = require('../')

function withLimits (limits, fields) {
  return multer({ limits: limits }).fields(fields)
}

function hasCode (code) {
  return (err) => err.code === code
}

function hasCodeAndField (code, field) {
  return (err) => err.code === code && err.field === field
}

function hasMessage (message) {
  return (err) => err.message === message
}

describe('Error Handling', () => {
  it('should throw on null', () => {
    assert.throws(() => multer(null))
  })

  it('should throw on boolean', () => {
    assert.throws(() => multer(true))
    assert.throws(() => multer(false))
  })

  it('should throw on invalid limits', () => {
    assert.throws(() => multer({ limits: { files: 3.14 } }), /Invalid limit "files" given: 3.14/)
    assert.throws(() => multer({ limits: { fileSize: 'foobar' } }), /Invalid limit "fileSize" given: foobar/)
  })

  it('should respect file size limit', async () => {
    const form = new FormData()
    const parser = withLimits({ fileSize: 1500 }, [
      { name: 'tiny', maxCount: 1 },
      { name: 'small', maxCount: 1 }
    ])

    form.append('tiny', util.file('tiny'))
    form.append('small', util.file('small'))

    await assertRejects(
      util.submitForm(parser, form),
      hasCodeAndField('LIMIT_FILE_SIZE', 'small')
    )
  })

  it('should respect file count limit', async () => {
    const form = new FormData()
    const parser = withLimits({ files: 1 }, [
      { name: 'small', maxCount: 1 },
      { name: 'small', maxCount: 1 }
    ])

    form.append('small', util.file('small'))
    form.append('small', util.file('small'))

    await assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FILE_COUNT')
    )
  })

  it('should respect file key limit', async () => {
    const form = new FormData()
    const parser = withLimits({ fieldNameSize: 4 }, [
      { name: 'small', maxCount: 1 }
    ])

    form.append('small', util.file('small'))

    await assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FIELD_KEY')
    )
  })

  it('should respect field key limit', async () => {
    const form = new FormData()
    const parser = withLimits({ fieldNameSize: 4 }, [])

    form.append('ok', 'SMILE')
    form.append('blowup', 'BOOM!')

    await assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FIELD_KEY')
    )
  })

  it('should respect field value limit', async () => {
    const form = new FormData()
    const parser = withLimits({ fieldSize: 16 }, [])

    form.append('field0', 'This is okay')
    form.append('field1', 'This will make the parser explode')

    await assertRejects(
      util.submitForm(parser, form),
      hasCodeAndField('LIMIT_FIELD_VALUE', 'field1')
    )
  })

  it('should respect field count limit', async () => {
    const form = new FormData()
    const parser = withLimits({ fields: 1 }, [])

    form.append('field0', 'BOOM!')
    form.append('field1', 'BOOM!')

    await assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FIELD_COUNT')
    )
  })

  it('should respect fields given', async () => {
    const form = new FormData()
    const parser = withLimits(undefined, [
      { name: 'wrongname', maxCount: 1 }
    ])

    form.append('small', util.file('small'))

    await assertRejects(
      util.submitForm(parser, form),
      hasCodeAndField('LIMIT_UNEXPECTED_FILE', 'small')
    )
  })

  it('should report errors from busboy constructor', async () => {
    const req = new stream.PassThrough()
    const upload = multer().single('tiny')
    const body = 'test'

    req.headers = {
      'content-type': 'multipart/form-data',
      'content-length': body.length
    }

    req.end(body)

    await assertRejects(
      pify(upload)(req, null),
      hasMessage('Multipart: Boundary not found')
    )
  })

  it('should report errors from busboy parsing', async () => {
    const req = new stream.PassThrough()
    const upload = multer().single('tiny')
    const boundary = 'AaB03x'
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="tiny"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      'test without end boundary'
    ].join('\r\n')

    req.headers = {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': body.length
    }

    req.end(body)

    await assertRejects(
      pify(upload)(req, null),
      hasMessage('Unexpected end of multipart data')
    )
  })

  it('should gracefully handle more than one error at a time', async () => {
    const form = new FormData()
    const parser = withLimits({ fileSize: 1, files: 1 }, [
      { name: 'small', maxCount: 1 }
    ])

    form.append('small', util.file('small'))
    form.append('small', util.file('small'))

    await assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FILE_SIZE')
    )
  })
})
