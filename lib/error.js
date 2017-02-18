var util = require('util')

var errorMessages = new Map([
  ['CLIENT_ABORTED', 'Client aborted'],
  ['LIMIT_PART_COUNT', 'Too many parts'],
  ['LIMIT_FILE_SIZE', 'File too large'],
  ['LIMIT_FILE_COUNT', 'Too many files'],
  ['LIMIT_FIELD_KEY', 'Field name too long'],
  ['LIMIT_FIELD_VALUE', 'Field value too long'],
  ['LIMIT_FIELD_COUNT', 'Too many fields'],
  ['LIMIT_UNEXPECTED_FILE', 'Unexpected file field']
])

function MulterError (code, optionalField) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.message = errorMessages.get(code)
  this.code = code

  if (optionalField) {
    this.field = optionalField
  }
}

util.inherits(MulterError, Error)

module.exports = MulterError
