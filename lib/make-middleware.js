var is = require('type-is')
var Busboy = require('busboy')
var extend = require('xtend')
var appendField = require('append-field')

var Counter = require('./counter')
var makeError = require('./make-error')
var removeUploadedFiles = require('./remove-uploaded-files')

function makeMiddleware (setup) {
  return function multerMiddleware (req, res, next) {
    if (!is(req, ['multipart'])) return next()

    var options = setup()

    var limits = options.limits
    var storage = options.storage
    var fileFilter = options.fileFilter
    var fileStrategy = options.fileStrategy

    switch (fileStrategy) {
      case 'VALUE': break
      case 'ARRAY': req.files = []; break
      case 'OBJECT': req.files = Object.create(null); break
      default: throw new Error('Unknown file strategy: ' + fileStrategy)
    }

    req.body = Object.create(null)

    var busboy = new Busboy({ headers: req.headers, limits: limits })
    var isDone = false
    var readFinished = false
    var pendingWrites = new Counter()
    var uploadedFiles = []

    function done (err) {
      if (isDone) return
      isDone = true
      req.unpipe(busboy)
      busboy.removeAllListeners()
      next(err)
    }

    function indicateDone () {
      if (readFinished && pendingWrites.isZero()) done()
    }

    function abortWithError (uploadError) {
      pendingWrites.onceZero(function () {
        function remove (file, cb) {
          storage._removeFile(req, file, cb)
        }

        removeUploadedFiles(uploadedFiles, remove, function (err, storageErrors) {
          if (err) return done(err)

          uploadError.storageErrors = storageErrors
          done(uploadError)
        })
      })
    }

    function abortWithCode (code, optionalField) {
      abortWithError(makeError(code, optionalField))
    }

    // handle text field data
    busboy.on('field', function (fieldname, value, fieldnameTruncated, valueTruncated) {
      if (fieldnameTruncated) return abortWithCode('LIMIT_FIELD_KEY')
      if (valueTruncated) return abortWithCode('LIMIT_FIELD_VALUE', fieldname)

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && limits.hasOwnProperty('fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return abortWithCode('LIMIT_FIELD_KEY')
      }

      appendField(req.body, fieldname, value)
    })

    // handle files
    busboy.on('file', function (fieldname, fileStream, filename, encoding, mimetype) {
      // don't attach to the files object, if there is no file
      if (!filename) return fileStream.resume()

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && limits.hasOwnProperty('fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return abortWithCode('LIMIT_FIELD_KEY')
      }

      var file = {
        fieldname: fieldname,
        originalname: filename,
        encoding: encoding,
        mimetype: mimetype
      }

      fileFilter(req, file, function (err, includeFile) {
        if (err) return abortWithError(err)
        if (!includeFile) return fileStream.resume()

        pendingWrites.increment()

        Object.defineProperty(file, 'stream', {
          configurable: true,
          enumerable: false,
          value: fileStream
        })

        fileStream.on('error', function (err) {
          pendingWrites.decrement()
          abortWithError(err)
        })

        fileStream.on('limit', function () {
          pendingWrites.decrement()
          abortWithCode('LIMIT_FILE_SIZE', fieldname)
        })

        storage._handleFile(req, file, function (err, info) {
          if (err) {
            pendingWrites.decrement()
            return abortWithError(err)
          }

          var fileInfo = extend(file, info)

          switch (fileStrategy) {
            case 'VALUE': req.file = fileInfo; break
            case 'ARRAY': req.files.push(fileInfo); break
            case 'OBJECT':
              if (req.files[fieldname]) {
                req.files[fieldname].push(fileInfo)
              } else {
                req.files[fieldname] = [fileInfo]
              }
              break
          }

          uploadedFiles.push(fileInfo)
          pendingWrites.decrement()
          indicateDone()
        })

      })

    })

    busboy.on('partsLimit', function () { abortWithCode('LIMIT_PART_COUNT') })
    busboy.on('filesLimit', function () { abortWithCode('LIMIT_FILE_COUNT') })
    busboy.on('fieldsLimit', function () { abortWithCode('LIMIT_FIELD_COUNT') })
    busboy.on('finish', function () {
      readFinished = true
      indicateDone()
    })

    req.pipe(busboy)
  }
}

module.exports = makeMiddleware
