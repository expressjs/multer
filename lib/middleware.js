var is = require('type-is')
var appendField = require('append-field')

var createFileAppender = require('./file-appender')
var readBody = require('./read-body')

module.exports = function createMiddleware (setup) {
  return function multerMiddleware (req, res, next) {
    if (!is(req, ['multipart'])) return next()

    var options = setup()

    readBody(req, options)
      .then(function (result) {
        req.body = Object.create(null)

        result.fields.forEach(function (field) {
          appendField(req.body, field.key, field.value)
        })

        var appendFile = createFileAppender(options.fileStrategy, req, options.fields)

        result.files.forEach(function (file) {
          appendFile(file)
        })
        next()
      })
      .catch(next)
  }
}
