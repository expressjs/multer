/* eslint-env mocha */
var assert = require('assert')
var EventEmitter = require('events').EventEmitter
var Module = require('module')

function loadMakeMiddlewareWithBusboy (fakeBusboyFactory) {
  var makeMiddlewarePath = require.resolve('../lib/make-middleware')
  var originalLoad = Module._load

  delete require.cache[makeMiddlewarePath]

  Module._load = function (request, parent, isMain) {
    if (request === 'busboy' && parent && parent.filename === makeMiddlewarePath) {
      return fakeBusboyFactory
    }

    return originalLoad.apply(this, arguments)
  }

  try {
    return require('../lib/make-middleware')
  } finally {
    Module._load = originalLoad
  }
}

function createFakeRequest () {
  var req = new EventEmitter()

  req.headers = {
    'content-type': 'multipart/form-data; boundary=----multer-boundary',
    'content-length': '1'
  }
  req.readable = true
  req.destroyed = false
  req.readableEnded = false

  req.read = function () {
    return null
  }

  req.resume = function () {}

  req.pipe = function (dest) {
    dest.pipe(this)
    return dest
  }

  req.unpipe = function () {}

  return req
}

describe('Busboy teardown race', function () {
  it('should not keep Multer error listener for late Busboy error after close', function (done) {
    var fakeBusboyInstance

    function FakeBusboy () {
      EventEmitter.call(this)

      this.errorListenersAtLateEmit = null
      this.lateErrorThrow = null
      this._internalNoopErrorListener = function () {}
      this.on('error', this._internalNoopErrorListener)
    }

    FakeBusboy.prototype = Object.create(EventEmitter.prototype)
    FakeBusboy.prototype.constructor = FakeBusboy

    FakeBusboy.prototype.removeAllListeners = function (eventName) {
      if (arguments.length === 0) {
        EventEmitter.prototype.removeAllListeners.call(this)
      } else {
        EventEmitter.prototype.removeAllListeners.call(this, eventName)
      }

      if (!eventName || eventName === 'error') {
        this.on('error', this._internalNoopErrorListener)
      }
      return this
    }

    FakeBusboy.prototype.pipe = function () {
      var self = this

      self.emit('close')

      process.nextTick(function () {
        self.errorListenersAtLateEmit = self.listeners('error').length

        try {
          self.emit('error', new Error('late busboy error'))
        } catch (err) {
          self.lateErrorThrow = err
        }
      })
    }

    FakeBusboy.prototype.destroy = function () {}

    var makeMiddleware = loadMakeMiddlewareWithBusboy(function () {
      fakeBusboyInstance = new FakeBusboy()
      return fakeBusboyInstance
    })

    var middleware = makeMiddleware(function () {
      return {
        limits: undefined,
        storage: {
          _handleFile: function (req, file, cb) {
            cb(null, {})
          },
          _removeFile: function (req, file, cb) {
            cb(null)
          }
        },
        fileFilter: function (req, file, cb) {
          cb(null, true)
        },
        fileStrategy: 'NONE',
        preservePath: false,
        defParamCharset: 'latin1'
      }
    })

    var req = createFakeRequest()

    middleware(req, null, function (err) {
      if (err) return done(err)

      setImmediate(function () {
        assert.strictEqual(fakeBusboyInstance.lateErrorThrow, null)
        assert.strictEqual(
          fakeBusboyInstance.errorListenersAtLateEmit,
          1,
          'late error should only see internal busboy error listener; observed listeners=' +
            fakeBusboyInstance.errorListenersAtLateEmit +
            ', lateErrorThrow=' +
            (fakeBusboyInstance.lateErrorThrow && fakeBusboyInstance.lateErrorThrow.message)
        )
        done()
      })
    })
  })
})
