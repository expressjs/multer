var errorMessages = {
  'LIMIT_FIELD_KEY': 'Field name too long',
  'LIMIT_FIELD_VALUE': 'Field value too long',
  'LIMIT_FILE_SIZE': 'File too large',
  'LIMIT_PARTS_COUNT': 'Too many parts',
  'LIMIT_FILES_COUNT': 'Too many files',
  'LIMIT_FIELD_COUNT': 'Too many fields'
}

function makeError (code) {
  var err = new Error(errorMessages[code])
  err.code = code
  return err
}

module.exports = makeError
