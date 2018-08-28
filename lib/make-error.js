var MulterError = require('./multer-error')

var errorMessages = {
  'LIMIT_PART_COUNT': 'Too many parts',
  'LIMIT_FILE_SIZE': 'File too large',
  'LIMIT_FILE_COUNT': 'Too many files',
  'LIMIT_FIELD_KEY': 'Field name too long',
  'LIMIT_FIELD_VALUE': 'Field value too long',
  'LIMIT_FIELD_COUNT': 'Too many fields',
  'LIMIT_UNEXPECTED_FILE': 'Unexpected field'
}

function makeError (code, field) {
  return new MulterError(errorMessages[code], code, field)
}

module.exports = makeError
