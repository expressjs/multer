var is = require('type-is')
var Busboy = require('busboy')
var extend = require('xtend')

var makeError = require('./lib/make-error')
var appendField = require('./lib/append-field')
var diskStorage = require('./storage/disk')
var memoryStorage = require('./storage/memory')

function allowAll (req, file, cb) {
  cb(null, true)
}

function multer (options) {
  options = options || {}

  var storage
  if (options.storage) {
    storage = options.storage
  } else {
    storage = diskStorage({ destination: options.dest })
  }

  var fileFilter = (options.fileFilter || allowAll)

  return function multerMiddleware (req, res, next) {
    if (!is(req, ['multipart'])) return next()

    req.body = Object.create(null)
    req.files = Object.create(null)

    var busboy = new Busboy(extend(options, { headers: req.headers }))
    var isDone = false
    var readFinished = false
    var pendingWrites = 0

    function done (err) {
      if (isDone) return
      isDone = true
      req.unpipe(busboy)
      busboy.removeAllListeners()
      next(err)
    }

    function indicateDone () {
      if (readFinished && pendingWrites === 0) done()
    }

    function abort (errOrCode) {
      if (typeof errOrCode === 'string') {
        done(makeError(errOrCode))
      } else {
        done(errOrCode)
      }
    }

    // handle text field data
    busboy.on('field', function (fieldname, value, fieldnameTruncated, valueTruncated) {
      if (fieldnameTruncated) return abort('LIMIT_FIELD_KEY')
      if (valueTruncated) return abort('LIMIT_FIELD_VALUE')

      appendField(req.body, fieldname, value)
    })

    // handle files
    busboy.on('file', function (fieldname, fileStream, filename, encoding, mimetype) {
      // don't attach to the files object, if there is no file
      if (!filename) return fileStream.resume()

      var file = {
        fieldname: fieldname,
        originalname: filename,
        encoding: encoding,
        mimetype: mimetype
      }

      fileFilter(req, file, function (err, includeFile) {
        if (err) return abort(err)
        if (!includeFile) return fileStream.resume()

        // defines is processing a new file
        pendingWrites++

        Object.defineProperty(file, 'stream', {
          configurable: true,
          enumerable: false,
          value: fileStream
        })

        fileStream.on('error', abort)
        fileStream.on('limit', function () {
          abort('LIMIT_FILE_SIZE')
        })

        storage.handleFile(req, file, function (err, info) {
          if (err) return abort(err)

          if (!req.files[fieldname]) req.files[fieldname] = []
          req.files[fieldname].push(extend(file, info))

          pendingWrites--
          indicateDone()
        })

      })

    })

    busboy.on('partsLimit', function () { abort('LIMIT_PARTS_COUNT') })
    busboy.on('filesLimit', function () { abort('LIMIT_FILES_COUNT') })
    busboy.on('fieldsLimit', function () { abort('LIMIT_FIELD_COUNT') })
    busboy.on('finish', function () {
      readFinished = true
      indicateDone()
    })

    req.pipe(busboy)
  }

}

module.exports = multer
module.exports.diskStorage = diskStorage
module.exports.memoryStorage = memoryStorage
