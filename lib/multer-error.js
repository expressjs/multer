var util = require('util')

var errorMessages = {
  'LIMIT_PART_COUNT': function () {
    return 'Too many parts'
  },
  'LIMIT_FILE_SIZE': function () {
    return 'File too large'
  },
  'LIMIT_FILE_COUNT': function () {
    return 'Too many files'
  },
  'LIMIT_FIELD_KEY': function () {
    return 'Field name too long'
  },
  'LIMIT_FIELD_VALUE': function () {
    return 'Field value too long'
  },
  'LIMIT_FIELD_COUNT': function () {
    return 'Too many fields'
  },
  'LIMIT_UNEXPECTED_FILE': function (field) {
    return 'Unexpected field ' + field
  }
}

function MulterError (code, field) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.message = errorMessages[code](field)
  this.code = code
  if (field) this.field = field
}

util.inherits(MulterError, Error)

module.exports = MulterError
