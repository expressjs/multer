var pify = require('pify')
var temp = require('fs-temp')
var Busboy = require('busboy')

var pump = pify(require('pump'))
var onFinished = pify(require('on-finished'))

var MulterError = require('./error')

function drainStream (stream) {
  stream.on('readable', stream.read.bind(stream))
}

function collectFields (busboy, limits) {
  return new Promise(function (resolve, reject) {
    var result = []

    busboy.on('field', function (fieldname, value, fieldnameTruncated, valueTruncated) {
      if (fieldnameTruncated) return reject(new MulterError('LIMIT_FIELD_KEY'))
      if (valueTruncated) return reject(new MulterError('LIMIT_FIELD_VALUE', fieldname))

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && limits.hasOwnProperty('fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return reject(new MulterError('LIMIT_FIELD_KEY'))
      }

      result.push({ key: fieldname, value: value })
    })

    busboy.on('finish', function () {
      resolve(result)
    })
  })
}

function collectFiles (busboy, limits, fileFilter) {
  return new Promise(function (resolve, reject) {
    var result = []

    busboy.on('file', function (fieldname, fileStream, filename, encoding, mimetype) {
      // Catch all errors on file stream
      fileStream.on('error', reject)

      // don't attach to the files object, if there is no file
      if (!filename) return fileStream.resume()

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && limits.hasOwnProperty('fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return reject(new MulterError('LIMIT_FIELD_KEY'))
      }

      var file = {
        fieldName: fieldname,
        originalName: filename
      }

      var limitHit = new Promise(function (resolve) {
        fileStream.on('limit', resolve)
      })

      Promise.resolve()
        .then(function () {
          return fileFilter(file)
        })
        .then(function () {
          limitHit.then(function () {
            reject(new MulterError('LIMIT_FILE_SIZE', fieldname))
          })

          var target = temp.createWriteStream()

          var fileClosed = new Promise(function (resolve) {
            target.on('close', resolve)
          })

          var promise = pump(fileStream, target)
            .then(function () {
              return fileClosed
            })
            .then(function () {
              file.path = target.path
              file.size = target.bytesWritten
              return file
            })
            .catch(reject)

          result.push(promise)
        })
        .catch(reject)
    })

    busboy.on('finish', function () {
      resolve(Promise.all(result))
    })
  })
}

function readBody (req, limits, fileFilter) {
  var busboy

  try {
    busboy = new Busboy({ headers: req.headers, limits: limits })
  } catch (err) {
    return Promise.reject(err)
  }

  var fields = collectFields(busboy, limits)
  var files = collectFiles(busboy, limits, fileFilter)
  var guard = new Promise(function (resolve, reject) {
    busboy.on('error', function (err) { reject(err) })
    busboy.on('partsLimit', function () { reject(new MulterError('LIMIT_PART_COUNT')) })
    busboy.on('filesLimit', function () { reject(new MulterError('LIMIT_FILE_COUNT')) })
    busboy.on('fieldsLimit', function () { reject(new MulterError('LIMIT_FIELD_COUNT')) })
    busboy.on('finish', resolve)
  })

  req.pipe(busboy)

  return Promise.all([fields, files, guard])
    .then(function (result) {
      return { fields: result[0], files: result[1] }
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
