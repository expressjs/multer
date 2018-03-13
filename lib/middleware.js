var is = require('type-is')
var fs = require('fs')
var appendField = require('append-field')

var createFileAppender = require('./file-appender')
var readBody = require('./read-body')

module.exports = function createMiddleware (setup) {
  return function multerMiddleware (req, res, next) {
    if (!is(req, ['multipart'])) return next()

    var options = setup()

    readBody(req, options.limits, options.fileFilter)
      .then(function (result) {
        req.body = Object.create(null)

        result.fields.forEach(function (field) {
          appendField(req.body, field.key, field.value)
        })

        var appendFile = createFileAppender(options.fileStrategy, req, options.fields)

        result.files.forEach(function (file) {
          var flushFn = function () {
            fs.unlink(file.path, function () {})
            if (res) {
              res.removeListener('finish', flushFn)
              res.removeListener('close', flushFn)
            }
          }

          if (res) {
            res.on('finish', flushFn)
            res.on('close', flushFn)
          }

          var stream

          Object.defineProperty(file, 'stream', {
            get: function () {
              if (stream) {
                return stream
              }
              stream = fs.createReadStream(file.path)
              stream.on('open', flushFn)
              return stream
            }
          })

          appendFile(file)
        })

        next()
      })
      .catch(next)
  }
}
