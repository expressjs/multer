var util = require('util')

var errorMessages = {
  LIMIT_PART_COUNT: 'Too many parts',
  LIMIT_FILE_SIZE: 'File too large',
  LIMIT_FILE_COUNT: 'Too many files',
  LIMIT_FIELD_KEY: 'Field name too long',
  LIMIT_FIELD_VALUE: 'Field value too long',
  LIMIT_FIELD_COUNT: 'Too many fields',
  LIMIT_UNEXPECTED_FILE: 'Unexpected field',
  MISSING_FIELD_NAME: 'Field name missing',
  LIMIT_OPTION_ERROR: 'Limit option must be an integer'
}

function MulterError (code, field) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.message = errorMessages[code]
  this.code = code
  if (field) {
    this.field = field
    if (code === 'LIMIT_OPTION_ERROR') this.message += `: ${field}`
  }
}

util.inherits(MulterError, Error)

module.exports = MulterError
