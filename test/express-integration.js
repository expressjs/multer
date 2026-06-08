/* eslint-env mocha */

import assert from 'node:assert'
import http from 'node:http'
import { promisify } from 'node:util'

import express from 'express'
import FormData from 'form-data'
import getStream from 'get-stream'
import _onFinished from 'on-finished'

import * as util from './_util.js'
import multer from '../index.js'

const onFinished = promisify(_onFinished)

const port = 34279

describe('Express Integration', () => {
  let app, server

  before((done) => {
    app = express()
    server = app.listen(port, done)
  })

  after((done) => {
    server.close(done)
  })

  function submitForm (form, path) {
    return new Promise((resolve, reject) => {
      const req = form.submit(`http://localhost:${port}${path}`)

      req.on('error', reject)
      req.on('response', (res) => {
        res.on('error', reject)

        const body = getStream.buffer(res)
        const finished = onFinished(req)

        resolve(Promise.all([body, finished]).then(([body]) => ({ res, body })))
      })
    })
  }

  it('should work with express error handling', async () => {
    const limits = { fileSize: 200 }
    const upload = multer({ limits: limits })
    const router = new express.Router()
    const form = new FormData()

    let routeCalled = 0
    let errorCalled = 0

    form.append('avatar', util.file('large'))

    router.post('/profile', upload.single('avatar'), (req, res, next) => {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use((err, req, res, next) => {
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')

      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t1', router)

    const result = await submitForm(form, '/t1/profile')

    assert.strictEqual(routeCalled, 0)
    assert.strictEqual(errorCalled, 1)
    assert.strictEqual(result.body.toString(), 'ERROR')
    assert.strictEqual(result.res.statusCode, 500)
  })

  it('should work when uploading a file', async () => {
    const upload = multer()
    const router = new express.Router()
    const form = new FormData()

    let routeCalled = 0
    let errorCalled = 0

    form.append('avatar', util.file('large'))

    router.post('/profile', upload.single('avatar'), (_, res) => {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use((_, __, res, ___) => {
      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t2', router)

    const result = await submitForm(form, '/t2/profile')

    assert.strictEqual(routeCalled, 1)
    assert.strictEqual(errorCalled, 0)
    assert.strictEqual(result.body.toString(), 'SUCCESS')
    assert.strictEqual(result.res.statusCode, 200)
  })

  // Regression for CVE-2025-47944 / CVE-2025-47935.
  it('should not crash on malformed request that causes two errors to be emitted by busboy', function (done) {
    this.timeout(5000)

    const router = new express.Router()
    router.post('/upload', multer().single('file'), (_, res) => res.status(500).end('Request should not be processed'))
    router.use((err, _, res, __) => res.status(200).end(err.message))

    app.use('/t3', router)

    const boundary = 'AaB03x'
    const body = [
      '--' + boundary,
      'Content-Disposition: form-data; name="file"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      '--' + boundary + '--',
      ''
    ].join('\r\n')

    let finished = false
    const finish = (err) => {
      if (finished) return
      finished = true
      clearTimeout(watchdog)
      done(err)
    }

    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/t3/upload',
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=' + boundary,
        'content-length': body.length
      }
    }, (res) => {
      assert.strictEqual(res.statusCode, 200)
      finish()
    })

    req.on('error', (err) => finish(err))
    req.write(body)
    req.end()

    const watchdog = setTimeout(() => {
      req.destroy()
      finish(new Error('Middleware hung on malformed multipart body'))
    }, 3000)
  })
})
