import fs from 'node:fs'

import appendField from 'append-field'
import is from 'type-is'

import createFileAppender from './file-appender.js'
import readBody from './read-body.js'

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

export default function createMiddleware (setup) {
  return function multerMiddleware (req, _, next) {
    if (!is(req, ['multipart'])) return next()
    handleRequest(setup, req).then(next, next)
  }
}
