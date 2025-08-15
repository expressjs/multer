const errorMessages = {
  LIMIT_PART_COUNT: 'Too many parts',
  LIMIT_FILE_SIZE: 'File too large',
  LIMIT_FILE_COUNT: 'Too many files',
  LIMIT_FIELD_KEY: 'Field name too long',
  LIMIT_FIELD_VALUE: 'Field value too long',
  LIMIT_FIELD_COUNT: 'Too many fields',
  LIMIT_UNEXPECTED_FILE: 'Unexpected field',
  MISSING_FIELD_NAME: 'Field name missing'
}

class MulterError extends Error {
  constructor (code, field) {
    super(errorMessages[code])
    this.name = this.constructor.name
    this.code = code
    if (field) this.field = field
  }
}

module.exports = MulterError
