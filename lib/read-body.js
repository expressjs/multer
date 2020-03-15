const path = require('path')
const pify = require('pify')
const temp = require('fs-temp')
const Busboy = require('busboy')
const FileType = require('stream-file-type')
const hasOwnProperty = require('has-own-property')

const pump = pify(require('pump'))
const onFinished = pify(require('on-finished'))

const MulterError = require('./error')

function drainStream (stream) {
  stream.on('readable', stream.read.bind(stream))
}

function collectFields (busboy, limits) {
  return new Promise((resolve, reject) => {
    const result = []

    busboy.on('field', (fieldname, value, fieldnameTruncated, valueTruncated) => {
      // istanbul ignore next: Currently not implemented (https://github.com/mscdex/busboy/issues/6)
      if (fieldnameTruncated) return reject(new MulterError('LIMIT_FIELD_KEY'))

      if (valueTruncated) return reject(new MulterError('LIMIT_FIELD_VALUE', fieldname))

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && hasOwnProperty(limits, 'fieldNameSize') && fieldname.length > limits.fieldNameSize) {
        return reject(new MulterError('LIMIT_FIELD_KEY'))
      }

      result.push({ key: fieldname, value: value })
    })

    busboy.on('finish', () => resolve(result))
  })
}

function collectFiles (busboy, limits, fileFilter) {
  return new Promise((resolve, reject) => {
    const result = []

    busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
      // Catch all errors on file stream
      fileStream.on('error', reject)

      // Catch limit exceeded on file stream
      fileStream.on('limit', () => {
        reject(new MulterError('LIMIT_FILE_SIZE', fieldname))
      })

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && hasOwnProperty(limits, 'fieldNameSize') && fieldname.length > limits.fieldNameSize) {
        return reject(new MulterError('LIMIT_FIELD_KEY'))
      }

      const file = {
        fieldName: fieldname,
        originalName: filename,
        clientReportedMimeType: mimetype,
        clientReportedFileExtension: path.extname(filename || '')
      }

      try {
        fileFilter(file)
      } catch (err) {
        return reject(err)
      }

      const target = temp.createWriteStream()
      const detector = new FileType()
      const fileClosed = new Promise((resolve) => target.on('close', resolve))

      const promise = pump(fileStream, detector, target)
        .then(async () => {
          await fileClosed
          file.path = target.path
          file.size = target.bytesWritten

          const fileType = await detector.fileTypePromise()
          file.detectedMimeType = (fileType ? fileType.mime : null)
          file.detectedFileExtension = (fileType ? `.${fileType.ext}` : '')

          return file
        })
        .catch(reject)

      result.push(promise)
    })

    busboy.on('finish', () => resolve(Promise.all(result)))
  })
}

async function readBody (req, limits, fileFilter) {
  const busboy = new Busboy({ headers: req.headers, limits: limits })

  const fields = collectFields(busboy, limits)
  const files = collectFiles(busboy, limits, fileFilter)
  const guard = new Promise((resolve, reject) => {
    req.on('error', (err) => reject(err))
    busboy.on('error', (err) => reject(err))

    req.on('aborted', () => reject(new MulterError('CLIENT_ABORTED')))
    busboy.on('filesLimit', () => reject(new MulterError('LIMIT_FILE_COUNT')))
    busboy.on('fieldsLimit', () => reject(new MulterError('LIMIT_FIELD_COUNT')))

    busboy.on('finish', resolve)
  })

  req.pipe(busboy)

  try {
    const result = await Promise.all([fields, files, guard])
    return { fields: result[0], files: result[1] }
  } catch (err) {
    req.unpipe(busboy)
    drainStream(req)
    busboy.removeAllListeners()

    // Wait for request to close, finish, or error
    await onFinished(req).catch(/* istanbul ignore next: Already handled by req.on('error', _) */ () => {})

    throw err
  }
}

module.exports = readBody
