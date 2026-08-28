var is = require('type-is')
var AsyncResource = require('async_hooks').AsyncResource
var Busboy = require('busboy')
var appendField = require('append-field')

var Counter = require('./counter')
var MulterError = require('./multer-error')
var FileAppender = require('./file-appender')
var removeUploadedFiles = require('./remove-uploaded-files')

// append-field turns a bracket group whose contents are all digits into an
// array index, so `a[3]` produces an array of length 4. The index itself is
// unbounded, which means a single field name can materialize a sparse array
// with a very large length. That costs append-field almost nothing, but it is
// the application that pays when it later iterates or serializes req.body, and
// until now there was no limit to opt into.
function exceedsArrayIndexLimit (fieldname, limit) {
  // Only field names append-field parses as a bracket path build an array;
  // names it stores as a literal key (e.g. a[6]suffix, [6]) never do, so they
  // must not be rejected by the index limit.
  if (!/^[^[]+(?:\[[^\]]+\])*(?:\[\])?$/.test(fieldname)) return false

  var pattern = /\[(\d+)\]/g
  var match

  while ((match = pattern.exec(fieldname)) !== null) {
    if (Number(match[1]) > limit) return true
  }

  return false
}

function drainStream (stream) {
  stream.on('readable', () => {
    while (stream.read() !== null) {}
  })
}

// The WHATWG HTML spec requires user agents to escape the bytes 0x0A (LF),
// 0x0D (CR) and 0x22 (") as %0A, %0D and %22 when serialising field names and
// filenames in a multipart/form-data body. Busboy leaves them escaped, so we
// reverse exactly those three sequences here to recover the original name.
// Only these are decoded on purpose: a bare `%` is never escaped by the spec,
// so a full decodeURIComponent would corrupt legitimate names like `50%.pdf`.
// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
function decodeFormDataName (str) {
  return str.replace(/%0A|%0D|%22/gi, function (match) {
    switch (match.toUpperCase()) {
      case '%0A': return '\n'
      case '%0D': return '\r'
      default: return '"'
    }
  })
}

function makeMiddleware (setup) {
  return function multerMiddleware (req, res, next) {
    // Preserve the caller's async context (AsyncLocalStorage, CLS) across the
    // busboy stream events that eventually call next(). runInAsyncScope exists
    // since Node 9 and passes arguments through on every version, unlike the
    // static AsyncResource.bind, which drops them on Node 14.
    var resource = new AsyncResource('multer')
    var originalNext = next
    next = function (err) {
      resource.runInAsyncScope(originalNext, null, err)
    }

    if (!is(req, ['multipart'])) return next()

    var options = setup()

    var limits = options.limits
    var busboyLimits = limits

    if (limits && Object.prototype.hasOwnProperty.call(limits, 'fileSize')) {
      busboyLimits = {}
      var key
      for (key in limits) {
        busboyLimits[key] = limits[key]
      }

      if (typeof limits.fileSize === 'number' && isFinite(limits.fileSize)) {
        busboyLimits.fileSize = limits.fileSize + 1
      }
    }

    var storage = options.storage
    var fileFilter = options.fileFilter
    var fileStrategy = options.fileStrategy
    var preservePath = options.preservePath
    var defParamCharset = options.defParamCharset

    req.body = Object.create(null)

    var busboy
    var appender = null
    var isDone = false
    var readFinished = false
    var errorOccured = false
    var pendingWrites = new Counter()
    var uploadedFiles = []
    var pendingFiles = []

    function done (err) {
      var called = false
      function onFinished () {
        if (called) return
        called = true
        next(err)
      }

      if (isDone) return
      isDone = true
      if (busboy) {
        req.unpipe(busboy)
        setImmediate(() => {
          busboy.removeAllListeners()
        })
      }
      drainStream(req)
      req.resume()

      // - if responding with an error, drain request body before calling
      //     next(err) -- avoids EPIPE on the client (server closing connection
      //     while the client is still sending the request body)
      // - also listen for 'close' so we don't hang when the client aborts (stream may never 'end')
      // - skip waiting if the stream is already destroyed (e.g. client aborted)
      if (err && req.readable && !req.destroyed) {
        req.once('end', onFinished)
        req.once('error', onFinished)
        req.once('close', onFinished)
        return
      }
      next(err)
    }

    function indicateDone () {
      if (readFinished && pendingWrites.isZero() && !errorOccured) done()
    }

    function abortWithError (uploadError, skipPendingWait) {
      if (errorOccured) return
      errorOccured = true

      function finishAbort () {
        function remove (file, cb) {
          storage._removeFile(req, file, cb)
        }

        var filesToRemove = uploadedFiles.concat(
          pendingFiles.filter(function (f) { return f.path })
        )
        pendingFiles = []

        removeUploadedFiles(filesToRemove, remove, function (err, storageErrors) {
          if (err) return done(err)

          uploadError.storageErrors = storageErrors
          done(uploadError)
        })
      }

      if (skipPendingWait) {
        finishAbort()
      } else {
        pendingWrites.onceZero(finishAbort)
      }
    }

    function abortWithCode (code, optionalField) {
      abortWithError(new MulterError(code, optionalField))
    }

    function handleRequestFailure (err) {
      if (isDone) return
      if (busboy) {
        req.unpipe(busboy)
        busboy.destroy(err)
      }
      abortWithError(err, true)
    }

    req.on('error', function (err) {
      handleRequestFailure(err || new Error('Request error'))
    })

    req.on('aborted', function () {
      handleRequestFailure(new Error('Request aborted'))
    })

    req.on('close', function () {
      if (req.readableEnded) return
      handleRequestFailure(new Error('Request closed'))
    })

    try {
      busboy = Busboy({
        headers: req.headers,
        limits: busboyLimits,
        preservePath: preservePath,
        defParamCharset: defParamCharset
      })
    } catch (err) {
      return next(err)
    }

    appender = new FileAppender(fileStrategy, req)

    // handle text field data
    busboy.on('field', function (fieldname, value, { nameTruncated, valueTruncated }) {
      if (fieldname == null) return abortWithCode('MISSING_FIELD_NAME')
      if (nameTruncated) return abortWithCode('LIMIT_FIELD_KEY')
      if (valueTruncated) return abortWithCode('LIMIT_FIELD_VALUE', fieldname)

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && Object.prototype.hasOwnProperty.call(limits, 'fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return abortWithCode('LIMIT_FIELD_KEY')
      }

      if (limits && Object.prototype.hasOwnProperty.call(limits, 'fieldNestingDepth')) {
        if (fieldname.split('[').length - 1 > limits.fieldNestingDepth) return abortWithCode('LIMIT_FIELD_NESTING', fieldname)
      }

      if (limits && Object.prototype.hasOwnProperty.call(limits, 'fieldArrayIndexLimit')) {
        if (exceedsArrayIndexLimit(fieldname, limits.fieldArrayIndexLimit)) {
          return abortWithCode('LIMIT_FIELD_ARRAY_INDEX', fieldname)
        }
      }

      try {
        appendField(req.body, fieldname, value)
      } catch {
        return abortWithCode('INVALID_FIELD_NAME', fieldname)
      }
    })

    // handle files
    busboy.on('file', function (fieldname, fileStream, { filename, encoding, mimeType }) {
      var pendingWritesIncremented = false
      var aborting = false
      var accepted = false
      var fileSizeLimitReached = false

      function decrementPendingWrites () {
        if (!pendingWritesIncremented) return
        pendingWritesIncremented = false
        pendingWrites.decrement()
      }

      fileStream.on('error', function (err) {
        decrementPendingWrites()
        abortWithError(err)
      })

      // Register 'limit' synchronously so an async fileFilter can't miss it.
      // Only abort once the file has been accepted.
      fileStream.on('limit', function () {
        fileSizeLimitReached = true
        if (accepted) {
          aborting = true
          abortWithCode('LIMIT_FILE_SIZE', fieldname)
        }
      })

      if (fieldname == null) return abortWithCode('MISSING_FIELD_NAME')

      // don't attach to the files object, if there is no file
      if (!filename) return fileStream.resume()

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && Object.prototype.hasOwnProperty.call(limits, 'fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return abortWithCode('LIMIT_FIELD_KEY')
      }

      var file = {
        fieldname: fieldname,
        originalname: decodeFormDataName(filename),
        encoding: encoding,
        mimetype: mimeType
      }

      var placeholder = appender.insertPlaceholder(file)

      fileFilter(req, file, function (err, includeFile) {
        if (errorOccured) {
          appender.removePlaceholder(placeholder)
          return fileStream.resume()
        }

        if (err) {
          appender.removePlaceholder(placeholder)
          return abortWithError(err)
        }

        if (!includeFile) {
          appender.removePlaceholder(placeholder)
          return fileStream.resume()
        }

        // 'limit' may have fired while an async fileFilter was pending.
        if (fileSizeLimitReached) {
          appender.removePlaceholder(placeholder)
          return abortWithCode('LIMIT_FILE_SIZE', fieldname)
        }

        accepted = true
        pendingWritesIncremented = true
        pendingWrites.increment()

        Object.defineProperty(file, 'stream', {
          configurable: true,
          enumerable: false,
          value: fileStream
        })

        pendingFiles.push(file)

        storage._handleFile(req, file, function (err, info) {
          var idx = pendingFiles.indexOf(file)
          if (idx !== -1) pendingFiles.splice(idx, 1)

          if (aborting) {
            appender.removePlaceholder(placeholder)
            uploadedFiles.push({ ...file, ...info })
            return decrementPendingWrites()
          }

          if (err) {
            appender.removePlaceholder(placeholder)
            decrementPendingWrites()
            return abortWithError(err)
          }

          var fileInfo = { ...file, ...info }

          appender.replacePlaceholder(placeholder, fileInfo)
          uploadedFiles.push(fileInfo)
          decrementPendingWrites()
          indicateDone()
        })
      })
    })

    busboy.on('error', function (err) { abortWithError(err) })
    busboy.on('partsLimit', function () { abortWithCode('LIMIT_PART_COUNT') })
    busboy.on('filesLimit', function () { abortWithCode('LIMIT_FILE_COUNT') })
    busboy.on('fieldsLimit', function () { abortWithCode('LIMIT_FIELD_COUNT') })
    busboy.on('close', function () {
      readFinished = true
      indicateDone()
    })

    req.pipe(busboy)
  }
}

module.exports = makeMiddleware
