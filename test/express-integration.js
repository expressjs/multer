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

describe('Express Integration', function () {
  let app, server

  before(function (done) {
    app = express()
    server = app.listen(port, done)
  })

  after(function (done) {
    server.close(done)
  })

  function submitForm (form, path) {
    return new Promise(function (resolve, reject) {
      const req = form.submit('http://localhost:' + port + path)

      req.on('error', reject)
      req.on('response', function (res) {
        res.on('error', reject)

        const body = getStream.buffer(res)
        const finished = onFinished(req)

        resolve(Promise.all([body, finished]).then(function (result) {
          return { res: res, body: result[0] }
        }))
      })
    })
  }

  it('should work with express error handling', function () {
    const limits = { fileSize: 200 }
    const upload = multer({ limits: limits })
    const router = new express.Router()
    const form = new FormData()

    let routeCalled = 0
    let errorCalled = 0

    form.append('avatar', util.file('large'))

    router.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use(function (err, req, res, next) {
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')

      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t1', router)
    return submitForm(form, '/t1/profile').then(function (result) {
      assert.strictEqual(routeCalled, 0)
      assert.strictEqual(errorCalled, 1)
      assert.strictEqual(result.body.toString(), 'ERROR')
      assert.strictEqual(result.res.statusCode, 500)
    })
  })

  it('should work when uploading a file', function () {
    const upload = multer()
    const router = new express.Router()
    const form = new FormData()

    let routeCalled = 0
    let errorCalled = 0

    form.append('avatar', util.file('large'))

    router.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use(function (_, req, res, next) {
      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t2', router)
    return submitForm(form, '/t2/profile').then(function (result) {
      assert.strictEqual(routeCalled, 1)
      assert.strictEqual(errorCalled, 0)
      assert.strictEqual(result.body.toString(), 'SUCCESS')
      assert.strictEqual(result.res.statusCode, 200)
    })
  })
})
