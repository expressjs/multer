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
    var left = filesLeft.get(file.fieldName) || 0

    if (left <= 0) {
      throw new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldName)
    }

    filesLeft.set(file.fieldName, left - 1)
  }
}
