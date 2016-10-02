var MulterError = require('./error')

module.exports = function createFileFilter (fields) {
  var filesLeft = new Map()

  fields.forEach(function (field) {
    if (typeof field.maxCount === 'number') {
      filesLeft.set(field.name, field.maxCount)
    } else {
      filesLeft.set(field.name, Infinity)
    }
  })

  return function fileFilter (file) {
    if (!filesLeft.has(file.fieldName)) {
      throw new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldName)
    }

    var left = filesLeft.get(file.fieldName)

    if (left <= 0) {
      throw new MulterError('LIMIT_FILE_COUNT', file.fieldName)
    }

    filesLeft.set(file.fieldName, left - 1)
  }
}
