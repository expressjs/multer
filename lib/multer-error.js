var util = require('util')

var errorMessages = {
  LIMIT_PART_COUNT: 'Too many parts',
  LIMIT_FILE_SIZE: 'File too large',
  LIMIT_FILE_COUNT: 'Too many files',
  LIMIT_FIELD_KEY: 'Field name too long',
  LIMIT_FIELD_VALUE: 'Field value too long',
  LIMIT_FIELD_COUNT: 'Too many fields',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
  MISSING_FIELD_NAME: 'Field name missing',
  LIMIT_FIELD_NESTING: 'Field name nesting too deep',
  LIMIT_FIELD_ARRAY_INDEX: 'Field name array index too large',
  STREAM_DESTROYED: 'File stream was destroyed',
  INVALID_FIELD_NAME: 'Invalid field name'
}

/**
 * Error raised by multer. Check `err.code` rather than the message.
 *
 * Codes: `LIMIT_PART_COUNT`, `LIMIT_FILE_SIZE`, `LIMIT_FILE_COUNT`,
 * `LIMIT_FIELD_KEY`, `LIMIT_FIELD_VALUE`, `LIMIT_FIELD_COUNT`,
 * `LIMIT_UNEXPECTED_FILE`, `MISSING_FIELD_NAME`, `LIMIT_FIELD_NESTING`,
 * `LIMIT_FIELD_ARRAY_INDEX`, `INVALID_FIELD_NAME`, `STREAM_DESTROYED`.
 *
 * @constructor
 * @extends Error
 * @param {string} code One of the codes above
 * @param {string} [field] Name of the field the error relates to
 * @param {string} [filename] Client-supplied file name, for file errors
 * @property {string} code
 * @property {string} [field]
 * @property {string} [filename]
 */
function MulterError (code, field, filename) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.message = errorMessages[code] || `Unknown error: ${code}`
  this.code = code
  if (field) this.field = field
  if (filename) this.filename = filename
}

util.inherits(MulterError, Error)

module.exports = MulterError
