var is = require('type-is')
var Busboy = require('busboy')
var extend = require('xtend')

var appendField = require('./lib/append-field')
var diskStorage = require('./storage/disk')
var memoryStorage = require('./storage/memory')

var errorMessages = {
  'LIMIT_FIELD_KEY': 'Field name too long',
  'LIMIT_FIELD_VALUE': 'Field value too long',
  'LIMIT_FILE_SIZE': 'File too large',
  'LIMIT_PARTS_COUNT': 'Too many parts',
  'LIMIT_FILES_COUNT': 'Too many files',
  'LIMIT_FIELD_COUNT': 'Too many fields'
}

function multer (options) {
  options = options || {}

  var storage
  if (options.storage) {
    storage = options.storage
  } else {
    storage = diskStorage({ destination: options.dest })
  }

  return function multerMiddleware (req, res, next) {
    if (!is(req, ['multipart'])) return next()

    req.body = Object.create(null)
    req.files = Object.create(null)

    var busboy = new Busboy(extend(options, { headers: req.headers }))
    var readFinished = false
    var pendingWrites = 0

    function indicateDone () {
      if (readFinished && pendingWrites === 0) next()
    }

    function makeError (code) {
      var err = new Error(errorMessages[code])
      err.code = code
      return err
    }

    function abort (errOrCode) {
      req.unpipe(busboy)
      busboy.removeAllListeners()

      if (typeof errOrCode === 'string') {
        next(makeError(errOrCode))
      } else {
        next(errOrCode)
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

      // defines is processing a new file
      pendingWrites++

      var file = {
        fieldname: fieldname,
        originalname: filename,
        encoding: encoding,
        mimetype: mimetype
      }

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
