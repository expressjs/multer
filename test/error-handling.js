/* eslint-env mocha */

const assert = require('assert')

const util = require('./_util')
const multer = require('../')
const stream = require('stream')
const FormData = require('form-data')
const assertRejects = require('assert-rejects')

function withLimits (limits, fields) {
  return multer({ limits: limits }).fields(fields)
}

function hasCode (code) {
  return function (err) {
    return err.code === code
  }
}

describe('Error Handling', function () {
  it('should respect parts limit', function () {
    const form = new FormData()
    const parser = withLimits({ parts: 1 }, [
      { name: 'small', maxCount: 1 }
    ])

    form.append('field0', 'BOOM!')
    form.append('small', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_PART_COUNT')
    )
  })

  it('should respect file size limit', function () {
    const form = new FormData()
    const parser = withLimits({ fileSize: 1500 }, [
      { name: 'tiny', maxCount: 1 },
      { name: 'small', maxCount: 1 }
    ])

    form.append('tiny', util.file('tiny'))
    form.append('small', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')
        assert.strictEqual(err.field, 'small')

        return true
      }
    )
  })

  it('should respect file count limit', function () {
    const form = new FormData()
    const parser = withLimits({ files: 1 }, [
      { name: 'small', maxCount: 1 },
      { name: 'small', maxCount: 1 }
    ])

    form.append('small', util.file('small'))
    form.append('small', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FILE_COUNT')
    )
  })

  it('should respect file key limit', function () {
    const form = new FormData()
    const parser = withLimits({ fieldNameSize: 4 }, [
      { name: 'small', maxCount: 1 }
    ])

    form.append('small', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FIELD_KEY')
    )
  })

  it('should respect field key limit', function () {
    const form = new FormData()
    const parser = withLimits({ fieldNameSize: 4 }, [])

    form.append('ok', 'SMILE')
    form.append('blowup', 'BOOM!')

    return assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FIELD_KEY')
    )
  })

  it('should respect field value limit', function () {
    const form = new FormData()
    const parser = withLimits({ fieldSize: 16 }, [])

    form.append('field0', 'This is okay')
    form.append('field1', 'This will make the parser explode')

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_FIELD_VALUE')
        assert.strictEqual(err.field, 'field1')

        return true
      }
    )
  })

  it('should respect field count limit', function () {
    const form = new FormData()
    const parser = withLimits({ fields: 1 }, [])

    form.append('field0', 'BOOM!')
    form.append('field1', 'BOOM!')

    return assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FIELD_COUNT')
    )
  })

  it('should respect fields given', function () {
    const form = new FormData()
    const parser = withLimits(undefined, [
      { name: 'wrongname', maxCount: 1 }
    ])

    form.append('small', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      function (err) {
        assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
        assert.strictEqual(err.field, 'small')

        return true
      }
    )
  })

  it('should report errors from busboy constructor', function (done) {
    const req = new stream.PassThrough()
    const upload = multer().single('tiny')
    const body = 'test'

    req.headers = {
      'content-type': 'multipart/form-data',
      'content-length': body.length
    }

    req.end(body)

    upload(req, null, function (err) {
      assert.strictEqual(err.message, 'Multipart: Boundary not found')
      done()
    })
  })

  it('should report errors from busboy parsing', function (done) {
    const req = new stream.PassThrough()
    const upload = multer().single('tiny')
    const boundary = 'AaB03x'
    const body = [
      '--' + boundary,
      'Content-Disposition: form-data; name="tiny"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      'test without end boundary'
    ].join('\r\n')

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': body.length
    }

    req.end(body)

    upload(req, null, function (err) {
      assert.strictEqual(err.message, 'Unexpected end of multipart data')
      done()
    })
  })

  it('should gracefully handle more than one error at a time', function () {
    const form = new FormData()
    const parser = withLimits({ fileSize: 1, files: 1 }, [
      { name: 'small', maxCount: 1 }
    ])

    form.append('small', util.file('small'))
    form.append('small', util.file('small'))

    return assertRejects(
      util.submitForm(parser, form),
      hasCode('LIMIT_FILE_SIZE')
    )
  })
})
