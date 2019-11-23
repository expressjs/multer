const createFileFilter = require('./lib/file-filter')
const createMiddleware = require('./lib/middleware')

function _middleware (limits, fields, fileStrategy) {
  return createMiddleware(() => ({
    fields: fields,
    limits: limits,
    fileFilter: createFileFilter(fields),
    fileStrategy: fileStrategy
  }))
}

class Multer {
  constructor (options) {
    this.limits = options.limits
  }

  single (name) {
    return _middleware(this.limits, [{ name: name, maxCount: 1 }], 'VALUE')
  }

  array (name, maxCount) {
    return _middleware(this.limits, [{ name: name, maxCount: maxCount }], 'ARRAY')
  }

  fields (fields) {
    return _middleware(this.limits, fields, 'OBJECT')
  }

  none () {
    return _middleware(this.limits, [], 'NONE')
  }

  any () {
    return createMiddleware(() => ({
      fields: [],
      limits: this.limits,
      fileFilter: () => {},
      fileStrategy: 'ARRAY'
    }))
  }
}

function multer (options = {}) {
  if (options === null) throw new TypeError('Expected object for argument "options", got null')
  if (typeof options !== 'object') throw new TypeError(`Expected object for argument "options", got ${typeof options}`)

  if (options.dest || options.storage || options.fileFilter) {
    throw new Error('The "dest", "storage" and "fileFilter" options where removed in Multer 2.0. Please refer to the latest documentation for new usage.')
  }

  return new Multer(options)
}

module.exports = multer
