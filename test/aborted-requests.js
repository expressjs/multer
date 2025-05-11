/* eslint-env mocha */

const assert = require('node:assert')
const { PassThrough } = require('node:stream')
const { promisify } = require('node:util')

const FormData = require('form-data')

const util = require('./_util')
const multer = require('../')

function getLength (form) {
  return promisify(form.getLength).call(form)
}

function createAbortStream (maxBytes, aborter) {
  let bytesPassed = 0

  return new PassThrough({
    transform (chunk, _, cb) {
      if (bytesPassed + chunk.length < maxBytes) {
        bytesPassed += chunk.length
        this.push(chunk)
        return cb()
      }

      const bytesLeft = maxBytes - bytesPassed

      if (bytesLeft) {
        bytesPassed += bytesLeft
        this.push(chunk.slice(0, bytesLeft))
      }

      process.nextTick(() => aborter(this))
    }
  })
}

describe('Aborted requests', () => {
  it('should handle clients aborting the request', async () => {
    const form = new FormData()
    const parser = multer().single('file')

    form.append('file', util.file('small'))

    const length = await getLength(form)
    const req = createAbortStream(length - 100, (stream) => stream.emit('aborted'))

    req.headers = {
      'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
      'content-length': length
    }

    const result = promisify(parser)(form.pipe(req), null)

    return assert.rejects(result, err => err.code === 'CLIENT_ABORTED')
  })

  it('should handle clients erroring the request', async () => {
    const form = new FormData()
    const parser = multer().single('file')

    form.append('file', util.file('small'))

    const length = await getLength(form)
    const req = createAbortStream(length - 100, (stream) => stream.emit('error', new Error('TEST_ERROR')))

    req.headers = {
      'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
      'content-length': length
    }

    const result = promisify(parser)(form.pipe(req), null)

    return assert.rejects(result, err => err.message === 'TEST_ERROR')
  })
})
