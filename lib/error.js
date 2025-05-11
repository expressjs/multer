const errorMessages = new Map([
  ['CLIENT_ABORTED', 'Client aborted'],
  ['LIMIT_FILE_SIZE', 'File too large'],
  ['LIMIT_FILE_COUNT', 'Too many files'],
  ['LIMIT_FIELD_KEY', 'Field name too long'],
  ['LIMIT_FIELD_VALUE', 'Field value too long'],
  ['LIMIT_FIELD_COUNT', 'Too many fields'],
  ['LIMIT_UNEXPECTED_FILE', 'Unexpected file field']
])

class MulterError extends Error {
  constructor (code, optionalField) {
    super(errorMessages.get(code))

    this.code = code
    this.name = this.constructor.name
    if (optionalField) this.field = optionalField

    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = MulterError
