const is = require('type-is')
const fs = require('fs')
const appendField = require('append-field')

const createFileAppender = require('./file-appender')
const readBody = require('./read-body')

module.exports = function createMiddleware (setup) {
  return function multerMiddleware (req, res, next) {
    if (!is(req, ['multipart'])) return next()

    const options = setup()

    readBody(req, options.limits, options.fileFilter)
      .then(function (result) {
        req.body = Object.create(null)

        result.fields.forEach(function (field) {
          appendField(req.body, field.key, field.value)
        })

        const appendFile = createFileAppender(options.fileStrategy, req, options.fields)

        result.files.forEach(function (file) {
          file.stream = fs.createReadStream(file.path)

          file.stream.on('open', function () {
            fs.unlink(file.path, function () {})
          })

          appendFile(file)
        })

        next()
      })
      .catch(next)
  }
}
