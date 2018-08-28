var util = require('util')

function MulterError (message, code, field) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.message = message
  this.code = code
  this.field = field
}

util.inherits(MulterError, Error)

module.exports = MulterError
