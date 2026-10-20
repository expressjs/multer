import { unlink } from 'node:fs'
import { extname } from 'node:path'
import { pipeline as _pipeline } from 'node:stream'
import { promisify } from 'node:util'

import Busboy from '@fastify/busboy'
import { createWriteStream } from 'fs-temp'
import _onFinished from 'on-finished'
import FileType from 'stream-file-type'

import MulterError from './error.js'

const onFinished = promisify(_onFinished)
const pipeline = promisify(_pipeline)

// append-field decides how a bracket name is stored: a bracket group is an
// array index only when it holds nothing but digits, and any name that does
// not parse completely (a[6]suffix, [6], a[[0]tail) is kept as a literal
// key instead of building an array. Mirror that grammar here so digits that
// are part of an object-key group (the [1001 key in items[[1001]) are never
// counted as array steps.
const reFirstKey = /^[^[]*/
const reDigitPath = /^\[(\d+)\]/
const reNormalPath = /^\[([^\]]+)\]/

function exceedsArrayIndexLimit (fieldname, limit) {
  const firstKey = reFirstKey.exec(fieldname)[0]
  if (!firstKey) return false

  const len = fieldname.length
  let pos = firstKey.length
  let overLimit = false

  while (pos < len) {
    let match

    if (fieldname[pos] === '[' && fieldname[pos + 1] === ']') {
      pos += 2
      if (pos !== len) return false
      continue
    }

    match = reDigitPath.exec(fieldname.substring(pos))
    if (match !== null) {
      if (parseInt(match[1], 10) > limit) overLimit = true
      pos += match[0].length
      continue
    }

    match = reNormalPath.exec(fieldname.substring(pos))
    if (match === null) return false

    pos += match[0].length
  }

  return overLimit
}

function drainStream (stream) {
  stream.on('readable', () => {
    while (stream.read() !== null) { /* drain */ }
  })
}

function collectFields (busboy, limits) {
  return new Promise((resolve, reject) => {
    const result = []

    busboy.on('field', (fieldname, value, fieldnameTruncated, valueTruncated) => {
      // Currently not implemented (https://github.com/mscdex/busboy/issues/6)
      /* c8 ignore next */
      if (fieldnameTruncated) return reject(new MulterError('LIMIT_FIELD_KEY'))

      if (valueTruncated) return reject(new MulterError('LIMIT_FIELD_VALUE', fieldname))

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && Object.hasOwn(limits, 'fieldNameSize') && fieldname.length > limits.fieldNameSize) {
        return reject(new MulterError('LIMIT_FIELD_KEY'))
      }

      if (limits && Object.hasOwn(limits, 'fieldNestingDepth')) {
        if (fieldname.split('[').length - 1 > limits.fieldNestingDepth) {
          return reject(new MulterError('LIMIT_FIELD_NESTING', fieldname))
        }
      }

      if (limits && Object.hasOwn(limits, 'fieldArrayIndexLimit')) {
        if (exceedsArrayIndexLimit(fieldname, limits.fieldArrayIndexLimit)) {
          return reject(new MulterError('LIMIT_FIELD_ARRAY_INDEX', fieldname))
        }
      }

      result.push({ key: fieldname, value: value })
    })

    busboy.on('finish', () => resolve(result))
  })
}

function collectFiles (busboy, limits, fileFilter, pendingTargets, settledPaths) {
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
      if (limits && Object.hasOwn(limits, 'fieldNameSize') && fieldname.length > limits.fieldNameSize) {
        return reject(new MulterError('LIMIT_FIELD_KEY'))
      }

      const file = {
        fieldName: fieldname,
        originalName: filename,
        clientReportedMimeType: mimetype,
        clientReportedFileExtension: extname(filename || '')
      }

      try {
        fileFilter(file)
      } catch (err) {
        return reject(err)
      }

      const target = createWriteStream()
      pendingTargets.add(target)
      const detector = new FileType()
      const fileClosed = new Promise((resolve) => target.on('close', resolve))

      const promise = pipeline(fileStream, detector, target)
        .then(async () => {
          await fileClosed
          pendingTargets.delete(target)
          // Track the finished file so an abort/error on a *later* file can
          // still remove it; once readBody resolves it is consumed downstream.
          settledPaths.add(target.path)
          file.path = target.path
          file.size = target.bytesWritten

          const fileType = await detector.fileTypePromise()
          file.detectedMimeType = (fileType ? fileType.mime : null)
          file.detectedFileExtension = (fileType ? `.${fileType.ext}` : '')

          return file
        })
        .catch((err) => {
          pendingTargets.delete(target)
          reject(err)
        })

      result.push(promise)
    })

    busboy.on('finish', () => resolve(Promise.all(result)))
  })
}

export default async function readBody (req, limits, fileFilter) {
  const busboy = new Busboy({ headers: req.headers, limits: limits })
  const pendingTargets = new Set()
  const settledPaths = new Set()

  const fields = collectFields(busboy, limits)
  const files = collectFiles(busboy, limits, fileFilter, pendingTargets, settledPaths)
  const guard = new Promise((resolve, reject) => {
    req.on('error', (err) => reject(err))
    busboy.on('error', (err) => reject(err))

    req.on('aborted', () => reject(new MulterError('CLIENT_ABORTED')))
    busboy.on('filesLimit', () => reject(new MulterError('LIMIT_FILE_COUNT')))
    busboy.on('fieldsLimit', () => reject(new MulterError('LIMIT_FIELD_COUNT')))

    busboy.on('finish', resolve)

    // Fallback when busboy stays silent on a malformed body.
    req.on('close', () => setImmediate(() => reject(new MulterError('CLIENT_ABORTED'))))
  })

  req.pipe(busboy)

  try {
    const result = await Promise.all([fields, files, guard])
    return { fields: result[0], files: result[1] }
  } catch (err) {
    req.unpipe(busboy)
    drainStream(req)
    req.resume()
    busboy.removeAllListeners()

    // Clean up any in-flight fs-temp files left behind by aborted/erroring uploads.
    for (const target of pendingTargets) {
      target.destroy()
      if (target.path) unlink(target.path, () => {})
    }
    pendingTargets.clear()

    // Also remove files that already finished writing: they are no longer in
    // pendingTargets and, since readBody is throwing, will never be consumed.
    for (const settledPath of settledPaths) {
      unlink(settledPath, () => {})
    }
    settledPaths.clear()

    // Wait for request to close, finish, or error
    await onFinished(req).catch(/* c8 ignore next: Already handled by req.on('error', _) */ () => {})

    throw err
  }
}
