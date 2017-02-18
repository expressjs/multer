/* eslint-env mocha */

var util = require('./_util')
var multer = require('../')

var assertRejects = require('assert-rejects')
var FormData = require('form-data')
var PassThrough = require('stream').PassThrough
var pify = require('pify')

function getLength (form) {
  return pify(form.getLength).call(form)
}

function createAbortStream (maxBytes) {
  var bytesPassed = 0

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

      process.nextTick(() => this.emit('aborted'))
    }
  })
}

describe('Aborted requests', function () {
  it('should handle clients aborting the request', function () {
    const form = new FormData()
    const parser = multer().single('file')

    form.append('file', util.file('small'))

    const result = getLength(form).then((length) => {
      const req = createAbortStream(length - 100)

      req.headers = {
        'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
        'content-length': length
      }

      return pify(parser)(form.pipe(req), null)
    })

    return assertRejects(result, err => err.code === 'CLIENT_ABORTED')
  })
})
