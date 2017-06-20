var createFileFilter = require('./lib/file-filter')
var createMiddleware = require('./lib/middleware')
var streamHandler = require('./lib/stream-handler')
var os = require('os')

function _middleware (limits, handler, fields, fileStrategy) {
  return createMiddleware(function setup () {
    return {
      fields: fields,
      limits: limits,
      handler: handler,
      fileFilter: createFileFilter(fields),
      fileStrategy: fileStrategy
    }
  })
}

function Multer (options) {
  if (typeof options === 'string') {
    this.handler = streamHandler.createHandler(options)
  } else {
    this.limits = options.limits
    this.handler = options.handler || streamHandler.createHandler(options.dest || os.tmpdir())
  }
}

Multer.prototype.single = function (name) {
  return _middleware(this.limits, this.handler, [{name: name, maxCount: 1}], 'VALUE')
}

Multer.prototype.array = function (name, maxCount) {
  return _middleware(this.limits, this.handler, [{name: name, maxCount: maxCount}], 'ARRAY')
}

Multer.prototype.fields = function (fields) {
  return _middleware(this.limits, this.handler, fields, 'OBJECT')
}

Multer.prototype.none = function () {
  return _middleware(this.limits, this.handler, [], 'NONE')
}

Multer.prototype.any = function () {
  function setup () {
    return {
      fields: [],
      limits: this.limits,
      handler: this.handler,
      fileFilter: function () {},
      fileStrategy: 'ARRAY'
    }
  }

  return createMiddleware(setup.bind(this))
}

function multer (options) {
  if (options === undefined) options = {}
  if (options === null) throw new TypeError('Expected object for argument "options", got null')
  if (typeof options !== 'object' && typeof options !== 'string') throw new TypeError('Expected object or string for argument "options", got ' + (typeof options))

  if (options.handler && typeof options.handler !== 'function') throw new TypeError('The handler must be a function')

  if (options.storage || options.fileFilter) {
    throw new Error('The "storage" and "fileFilter" options where removed in Multer 2.0. Please refer to the latest documentation for new usage.')
  }

  return new Multer(options)
}

module.exports = multer
