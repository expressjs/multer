var path = require('path')
var pify = require('pify')
var Busboy = require('busboy')
var FileType = require('stream-file-type')
var normalize = require('./stream-handler').normalize

var pump = pify(require('pump'))
var onFinished = pify(require('on-finished'))

var MulterError = require('./error')

function drainStream (stream) {
  stream.on('readable', stream.read.bind(stream))
}

function isPromise (target) {
  var type = typeof target
  return target !== null && (type === 'object' || type === 'function') && typeof target.then === 'function'
}

// Support promises in the stream and the finish properties
function waitFor () {
  var fn = arguments[0]
  // Replace with rest arguments if engine compatibility allows it
  var args = Array.prototype.slice.call(arguments, 1)
  var target = fn.apply(fn, args)
  return !isPromise(target) ? Promise.resolve(target) : target
}

function collectFields (busboy, options) {
  return new Promise(function (resolve, reject) {
    var result = []
    var limits = options.limits

    busboy.on('field', function (fieldname, value, fieldnameTruncated, valueTruncated) {
      if (fieldnameTruncated) return reject(new MulterError('LIMIT_FIELD_KEY'))
      if (valueTruncated) return reject(new MulterError('LIMIT_FIELD_VALUE', fieldname))

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && limits.hasOwnProperty('fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return reject(new MulterError('LIMIT_FIELD_KEY'))
      }

      result.push({key: fieldname, value: value})
    })

    busboy.on('finish', function () {
      resolve(result)
    })
  })
}

function collectFiles (req, busboy, options) {
  return new Promise(function (resolve, reject) {
    var result = []
    var limits = options.limits
    var fileFilter = options.fileFilter

    busboy.on('file', function (fieldname, fileStream, filename, encoding, mimetype) {
      // Catch all errors on file stream
      fileStream.on('error', reject)

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && limits.hasOwnProperty('fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return reject(new MulterError('LIMIT_FIELD_KEY'))
      }

      var file = {
        fieldName: fieldname,
        originalName: filename,
        clientReportedMimeType: mimetype,
        clientReportedFileExtension: path.extname(filename || '')
      }

      var limitHit = new Promise(function (resolve) {
        fileStream.on('limit', resolve)
      })

      var handler = normalize(options.handler(req, file))

      Promise.resolve()
        .then(function () {
          return fileFilter(file)
        })
        .then(function () {
          limitHit.then(function () {
            reject(new MulterError('LIMIT_FILE_SIZE', fieldname))
          })

          return waitFor(handler.stream)
            .then(function (target) {
              var detector = new FileType()

              var fileClosed = new Promise(function (resolve, reject) {
                var evt = 'close'
                if (handler.event) {
                  evt = typeof handler.event === 'function' ? handler.event() : handler.event
                }

                target.on(evt, function () {
                  if (!handler.finish) {
                    return resolve()
                  }

                  // Different stream implementations could have custom events with unknown number of arguments
                  // This is why the finish function can be used to gather this arguments and merge them with the file object
                  // Right after the stream has been consumed
                  var evtArgs = Array.prototype.slice.call(arguments)
                  evtArgs.unshift(handler.finish)
                  waitFor.apply(null, evtArgs)
                    .then(function () {
                      resolve()
                    })
                    .catch(reject)
                })
              })

              var promise = pump(fileStream, detector, target)
                .then(function () {
                  return fileClosed
                })
                .then(function () {
                  return detector.fileTypePromise()
                })
                .then(function (fileType) {
                  file.detectedMimeType = (fileType ? fileType.mime : null)
                  file.detectedFileExtension = (fileType ? '.' + fileType.ext : '')
                  return file
                })
                .catch(reject)

              result.push(promise)
            })
        })
        .catch(reject)
    })

    busboy.on('finish', function () {
      resolve(Promise.all(result))
    })
  })
}

function readBody (req, options) {
  var busboy

  try {
    busboy = new Busboy({headers: req.headers, limits: options.limits})
  } catch (err) {
    return Promise.reject(err)
  }

  var fields = collectFields(busboy, options)
  var files = collectFiles(req, busboy, options)
  var guard = new Promise(function (resolve, reject) {
    req.on('error', function (err) { reject(err) })
    busboy.on('error', function (err) { reject(err) })

    req.on('aborted', function () { reject(new MulterError('CLIENT_ABORTED')) })
    busboy.on('partsLimit', function () { reject(new MulterError('LIMIT_PART_COUNT')) })
    busboy.on('filesLimit', function () { reject(new MulterError('LIMIT_FILE_COUNT')) })
    busboy.on('fieldsLimit', function () { reject(new MulterError('LIMIT_FIELD_COUNT')) })

    busboy.on('finish', resolve)
  })

  req.pipe(busboy)

  return Promise.all([fields, files, guard])
    .then(function (result) {
      return {fields: result[0], files: result[1]}
    })
    .catch(function (err) {
      req.unpipe(busboy)
      drainStream(req)
      busboy.removeAllListeners()

      return onFinished(req).then(
        function () { throw err },
        function () { throw err }
      )
    })
}

module.exports = readBody
