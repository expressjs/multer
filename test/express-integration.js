/* eslint-env mocha */

const assert = require('assert')

const multer = require('../')
const util = require('./_util')

const pify = require('pify')
const express = require('express')
const FormData = require('form-data')
const getStream = require('get-stream')

const onFinished = pify(require('on-finished'))

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
})
