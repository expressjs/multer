const is = require('type-is')
const fs = require('fs')
const appendField = require('append-field')

const createFileAppender = require('./file-appender')
const readBody = require('./read-body')

async function handleRequest (setup, req) {
  const options = setup()
  const result = await readBody(req, options.limits, options.fileFilter)

  req.body = Object.create(null)

  for (const field of result.fields) {
    appendField(req.body, field.key, field.value)
  }

  const appendFile = createFileAppender(options.fileStrategy, req, options.fields)

  for (const file of result.files) {
    file.stream = fs.createReadStream(file.path)
    file.stream.on('open', () => fs.unlink(file.path, () => {}))

    appendFile(file)
  }
}

function createMiddleware (setup) {
  return function multerMiddleware (req, res, next) {
    if (!is(req, ['multipart'])) return next()
    handleRequest(setup, req).then(next, next)
  }
}

module.exports = createMiddleware
