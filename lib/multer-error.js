var util = require('util')

var errorMessages = {
  LIMIT_PART_COUNT: 'Too many parts',
  LIMIT_FILE_SIZE: 'File too large',
  LIMIT_FILE_COUNT: 'Too many files',
  LIMIT_FIELD_KEY: 'Field name too long',
  LIMIT_FIELD_VALUE: 'Field value too long',
  LIMIT_FIELD_COUNT: 'Too many fields',
  LIMIT_UNEXPECTED_FILE: 'Unexpected field',
  MISSING_FIELD_NAME: 'Field name missing'
}

/**
 * Custom error class for handling Multer errors.
 * @class
 * @param {string} code - The error code corresponding to the error message.
 * @param {string} [field] - The field associated with the error (optional).
 */
function MulterError (code, field) {
  // Capture the stack trace for the custom error
  Error.captureStackTrace(this, this.constructor)
  
  // Set the error name to the constructor name
  this.name = this.constructor.name

  // Set the error message based on the provided error code
  this.message = errorMessages[code]

  // Set the error code
  this.code = code

  // If a field is provided, associate it with the error
  if (field) this.field = field
}

// Inherit from the native Error class
util.inherits(MulterError, Error)

module.exports = MulterError
