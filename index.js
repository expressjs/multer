var makeMiddleware = require('./lib/make-middleware')

var diskStorage = require('./storage/disk')
var memoryStorage = require('./storage/memory')
var MulterError = require('./lib/multer-error')
var validateLimits = require('./lib/validate-limits')

/**
 * A file parsed from a multipart request.
 *
 * @typedef {Object} File
 * @property {string} fieldname Name of the form field
 * @property {string} originalname Name of the file on the client (client-supplied, treat as untrusted)
 * @property {string} encoding Transfer encoding of the file
 * @property {string} mimetype MIME type of the file
 * @property {number} size Size of the file in bytes
 * @property {string} [destination] Folder the file was saved to (`DiskStorage`)
 * @property {string} [filename] Name of the file within `destination` (`DiskStorage`)
 * @property {string} [path] Full path of the saved file (`DiskStorage`)
 * @property {Buffer} [buffer] Contents of the file (`MemoryStorage`)
 */

/**
 * Size limits, passed to busboy. All are optional.
 *
 * @typedef {Object} Limits
 * @property {number} [fieldNameSize=100] Max field name size in bytes
 * @property {number} [fieldSize=1048576] Max field value size in bytes
 * @property {number} [fields=Infinity] Max number of non-file fields
 * @property {number} [fileSize=Infinity] Max file size in bytes (integer or `Infinity`)
 * @property {number} [files=Infinity] Max number of file fields
 * @property {number} [parts=Infinity] Max number of parts (fields + files)
 * @property {number} [headerPairs=2000] Max number of header key/value pairs to parse
 * @property {number} [fieldNestingDepth=Infinity] Max nesting depth of field names (`a[b][c]` has 2 levels)
 * @property {number} [fieldArrayIndexLimit=Infinity] Max numeric array index accepted in field names
 */

/**
 * Decides whether a file is accepted. Call `cb(null, true)` to accept the
 * file, `cb(null, false)` to skip it silently, or `cb(err)` to abort.
 *
 * @callback FileFilter
 * @param {Object} req The request
 * @param {File} file The file being uploaded (without `size`, `path` or `buffer`)
 * @param {function(?Error, boolean=): void} cb
 */

/**
 * Storage engine. See StorageEngine.md for the full contract.
 *
 * @typedef {Object} StorageEngine
 * @property {function(Object, File, function(?Error, Object=): void): void} _handleFile
 *   Consumes `file.stream` and calls back with the properties to merge into the file object
 * @property {function(Object, File, function(?Error): void): void} _removeFile
 *   Removes a stored file when the request fails
 */

/**
 * @typedef {Object} Options
 * @property {string} [dest] Folder to store files in (uses `DiskStorage`)
 * @property {StorageEngine} [storage] Storage engine; defaults to `MemoryStorage` when neither `dest` nor `storage` is set
 * @property {FileFilter} [fileFilter] Controls which files are accepted
 * @property {Limits} [limits] Size limits
 * @property {boolean} [preservePath=false] Keep the full client-supplied path in `file.originalname`
 * @property {string} [defParamCharset='latin1'] Charset for part header parameters (e.g. filename) without an explicit one
 */

function allowAll (req, file, cb) {
  cb(null, true)
}

/**
 * @constructor
 * @private
 * @param {Options} options
 */
function Multer (options) {
  if (options.storage) {
    this.storage = options.storage
  } else if (options.dest) {
    this.storage = diskStorage({ destination: options.dest })
  } else {
    this.storage = memoryStorage()
  }

  if (options.limits && typeof options.limits !== 'function') validateLimits(options.limits)

  this.limits = options.limits
  this.preservePath = options.preservePath
  this.defParamCharset = options.defParamCharset || 'latin1'
  this.fileFilter = options.fileFilter || allowAll
}

Multer.prototype._makeMiddleware = function (fields, fileStrategy) {
  function setup () {
    var fileFilter = this.fileFilter
    var filesLeft = Object.create(null)

    fields.forEach(function (field) {
      if (typeof field.maxCount === 'number') {
        filesLeft[field.name] = field.maxCount
      } else {
        filesLeft[field.name] = Infinity
      }
    })

    function wrappedFileFilter (req, file, cb) {
      if ((filesLeft[file.fieldname] || 0) <= 0) {
        return cb(new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname, file.originalname))
      }

      // Only count the file against the field's maxCount once the user's
      // fileFilter has accepted it. A file skipped via cb(null, false) is
      // never stored, so it must not consume a slot (see #1419).
      fileFilter(req, file, function (err, includeFile) {
        if (!err && includeFile) filesLeft[file.fieldname] -= 1
        cb(err, includeFile)
      })
    }

    return {
      limits: this.limits,
      preservePath: this.preservePath,
      defParamCharset: this.defParamCharset,
      storage: this.storage,
      fileFilter: wrappedFileFilter,
      fileStrategy: fileStrategy
    }
  }

  return makeMiddleware(setup.bind(this))
}

/**
 * Accept a single file for the field `name`. The file is stored in `req.file`.
 *
 * @param {string} name
 * @returns {function(Object, Object, function(?Error): void): void} Express middleware
 */
Multer.prototype.single = function (name) {
  return this._makeMiddleware([{ name: name, maxCount: 1 }], 'VALUE')
}

/**
 * Accept an array of files for the field `name`, stored in `req.files`.
 * Files skipped by `fileFilter` do not count towards `maxCount`.
 *
 * @param {string} name
 * @param {number} [maxCount] Error with `LIMIT_UNEXPECTED_FILE` if more files are accepted
 * @returns {function(Object, Object, function(?Error): void): void} Express middleware
 */
Multer.prototype.array = function (name, maxCount) {
  return this._makeMiddleware([{ name: name, maxCount: maxCount }], 'ARRAY')
}

/**
 * Accept a mix of files. `req.files` is an object keyed by field name, each
 * value an array of files.
 *
 * @param {Array<{name: string, maxCount?: number}>} fields
 * @returns {function(Object, Object, function(?Error): void): void} Express middleware
 */
Multer.prototype.fields = function (fields) {
  return this._makeMiddleware(fields, 'OBJECT')
}

/**
 * Accept only text fields. Any file results in a `LIMIT_UNEXPECTED_FILE` error.
 *
 * @returns {function(Object, Object, function(?Error): void): void} Express middleware
 */
Multer.prototype.none = function () {
  return this._makeMiddleware([], 'NONE')
}

/**
 * Accept all files, stored as an array in `req.files`. Only use this on routes
 * that handle every uploaded file.
 *
 * @returns {function(Object, Object, function(?Error): void): void} Express middleware
 */
Multer.prototype.any = function () {
  function setup () {
    return {
      limits: this.limits,
      preservePath: this.preservePath,
      defParamCharset: this.defParamCharset,
      storage: this.storage,
      fileFilter: this.fileFilter,
      fileStrategy: 'ARRAY'
    }
  }

  return makeMiddleware(setup.bind(this))
}

/**
 * Create a multer instance. Text fields are parsed into `req.body`; files go to
 * `req.file` or `req.files` depending on the method used.
 *
 * @param {Options} [options]
 * @returns {Multer}
 * @throws {TypeError} If `options` is not an object
 */
function multer (options) {
  if (options === undefined) {
    return new Multer({})
  }

  if (typeof options === 'object' && options !== null) {
    return new Multer(options)
  }

  throw new TypeError('Expected object for argument options')
}

module.exports = multer
module.exports.diskStorage = diskStorage
module.exports.memoryStorage = memoryStorage
module.exports.MulterError = MulterError
