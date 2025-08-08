var makeMiddleware = require('./lib/make-middleware')

var diskStorage = require('./storage/disk')
var memoryStorage = require('./storage/memory')
var MulterError = require('./lib/multer-error')

/**
 * Default file filter function that allows all files to be processed.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} file - The file object containing file details such as `fieldname`, `originalname`, `encoding`, and `mimetype`.
 * @param {Function} cb - A callback function that takes two arguments:
 *   - `err` (Error, if any, or `null` to allow the file)
 *   - `acceptFile` (Boolean, `true` to accept the file, `false` to reject it)
 */
function allowAll (req, file, cb) {
  cb(null, true)
}

/**
 * Multer constructor function that configures the file handling middleware.
 * 
 * @class
 * @param {Object} options - Configuration options for Multer.
 * @param {Object} [options.storage] - Storage engine to use for saving files.
 * @param {string} [options.dest] - Directory path for storing files, if no custom storage engine is provided.
 * @param {Object} [options.limits] - Limits for file size, field size, etc.
 * @param {boolean} [options.preservePath=false] - Whether to preserve the file's original path.
 * @param {Function} [options.fileFilter=allowAll] - Function to filter which files to accept or reject. Receives `req`, `file`, and a callback function as arguments.
 * 
 * @throws {TypeError} Throws an error if `options` is neither undefined nor an object.
 * 
 * @property {Object} storage - Storage engine used for saving files.
 * @property {Object} limits - File size and count limits.
 * @property {boolean} preservePath - Flag for preserving original file paths.
 * @property {Function} fileFilter - Filter function to determine if a file should be saved.
 * 
 * @example
 * const upload = new Multer({ dest: 'uploads/' });
 * 
 * @description
 * Multer is a file handling middleware for Node.js. It provides configuration for file storage location, size limits, and file filtering, enabling file uploads for multipart form-data.
 */
function Multer (options) {
  if (options.storage) {
    this.storage = options.storage
  } else if (options.dest) {
    this.storage = diskStorage({ destination: options.dest })
  } else {
    this.storage = memoryStorage()
  }

  this.limits = options.limits
  this.preservePath = options.preservePath
  this.fileFilter = options.fileFilter || allowAll
}

/**
 * Creates a middleware function for handling file uploads with custom settings.
 * 
 * @private
 * @param {Array<{name: string, maxCount: number}>} fields - Array of field configurations. Each field object specifies a `name` and a `maxCount` for the field, defining which fields to handle and how many files are allowed per field.
 * @param {string} fileStrategy - Strategy for handling files, which can be 'VALUE', 'ARRAY', 'OBJECT', or 'NONE'.
 * 
 * @returns {Function} Middleware function that can handle multipart file uploads.
 * 
 * @description
 * `_makeMiddleware` generates middleware for processing file uploads, controlling how fields and files are managed based on specified fields and file strategy.
 * 
 * - **File Strategy**: Determines how uploaded files are organized:
 *   - `VALUE`: Allows a single file per field.
 *   - `ARRAY`: Allows multiple files to be collected as an array.
 *   - `OBJECT`: Stores files in an object keyed by field name.
 *   - `NONE`: No files are allowed.
 * 
 * @example
 * const upload = new Multer({ dest: 'uploads/' });
 * const singleUploadMiddleware = upload.single('avatar');
 * const arrayUploadMiddleware = upload.array('photos', 5);
 */
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

    /**
 * Wraps the user-defined file filter to enforce field-specific file count limits.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} file - The file object representing the current file being processed.
 * @param {Function} cb - Callback function to indicate whether the file should be accepted or rejected. Calls with `cb(null, true)` to accept or `cb(new Error)` to reject.
 * 
 * @throws {MulterError} Throws a `LIMIT_UNEXPECTED_FILE` error if the file exceeds the allowed count for its field.
 * 
 * @description
 * `wrappedFileFilter` is an internal function used to wrap the user-defined `fileFilter`. It ensures that each field does not exceed its specified file count (`maxCount`), calling the provided `fileFilter` function only when this condition is met.
 * 
 * - **Exceeding Limit**: If the number of files for a field exceeds its `maxCount`, the function calls `cb` with a `MulterError`, preventing additional files for that field from being processed.
 * - **Calling User File Filter**: After verifying the limit, it passes the file to the user-defined `fileFilter` for custom processing or further validation.
 * 
 * @example
 * const upload = multer({ limits: { fileSize: 1000000 } });
 * const fileFilter = (req, file, cb) => {
 *   if (file.mimetype === 'image/jpeg') cb(null, true);
 *   else cb(new Error('Only JPEGs are allowed'));
 * };
 * 
 * const middleware = upload.fields([
 *   { name: 'avatar', maxCount: 1 },
 *   { name: 'gallery', maxCount: 5 }
 * ]);
 */
    function wrappedFileFilter (req, file, cb) {
      if ((filesLeft[file.fieldname] || 0) <= 0) {
        return cb(new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
      }

      filesLeft[file.fieldname] -= 1
      fileFilter(req, file, cb)
    }

    return {
      limits: this.limits,
      preservePath: this.preservePath,
      storage: this.storage,
      fileFilter: wrappedFileFilter,
      fileStrategy: fileStrategy
    }
  }

  return makeMiddleware(setup.bind(this))
}

/**
 * Creates middleware for handling a single file upload for a specified field.
 * 
 * @param {string} name - The name of the form field to accept a single file upload.
 * @returns {Function} Middleware function to handle single file uploads.
 * 
 * @description
 * `Multer.prototype.single` is a method that generates middleware specifically for handling single file uploads for a specified field. This middleware will only accept one file for the given `name` field, rejecting additional files if provided in the same field.
 * 
 * - **File Handling Strategy**: Sets the `fileStrategy` to `'VALUE'`, meaning only a single file is stored as `req.file` rather than in an array or object.
 * - **Field-Specific Limit**: Allows only one file in the specified field name and rejects additional files in that field.
 * 
 * @example
 * // Usage example:
 * const multer = require('multer');
 * const upload = multer({ dest: 'uploads/' });
 * 
 * app.post('/profile', upload.single('avatar'), (req, res) => {
 *   // Access the uploaded file with req.file
 *   res.send('Single file upload successful!');
 * });
 * 
 * @throws {MulterError} Throws `LIMIT_UNEXPECTED_FILE` if additional files are uploaded in the specified field.
 */
Multer.prototype.single = function (name) {
  return this._makeMiddleware([{ name: name, maxCount: 1 }], 'VALUE')
}

/**
 * Creates middleware for handling multiple file uploads for a specified field.
 *
 * @param {string} name - The name of the form field to accept multiple file uploads.
 * @param {number} [maxCount] - Optional maximum number of files allowed for the specified field. If not specified, there is no limit.
 * @returns {Function} Middleware function to handle multiple file uploads.
 *
 * @description
 * `Multer.prototype.array` is a method that generates middleware for handling multiple file uploads on a specified field name. This middleware allows multiple files to be uploaded under the same field, storing them in `req.files` as an array.
 * 
 * - **File Handling Strategy**: Sets the `fileStrategy` to `'ARRAY'`, meaning files are stored as an array under `req.files`, making each file accessible as individual elements in the array.
 * - **Field-Specific Limit**: Accepts multiple files but can limit the number of files in the specified field if `maxCount` is provided.
 *
 * @example
 * // Usage example:
 * const multer = require('multer');
 * const upload = multer({ dest: 'uploads/' });
 * 
 * app.post('/photos', upload.array('photos', 10), (req, res) => {
 *   // Access uploaded files with req.files
 *   res.send(`Uploaded ${req.files.length} photos successfully!`);
 * });
 *
 * @throws {MulterError} Throws `LIMIT_UNEXPECTED_FILE` if the number of uploaded files exceeds `maxCount`.
 */
Multer.prototype.array = function (name, maxCount) {
  return this._makeMiddleware([{ name: name, maxCount: maxCount }], 'ARRAY')
}

/**
 * Creates middleware for handling multiple file uploads for multiple fields.
 *
 * @param {Array<Object>} fields - An array of objects specifying fields to accept files for. Each object in the array should have:
 *   - `name` (string): The name of the field to accept file uploads.
 *   - `maxCount` (number, optional): Maximum number of files allowed for this field. Defaults to `Infinity` if not provided.
 * @returns {Function} Middleware function to handle file uploads across multiple fields.
 *
 * @description
 * `Multer.prototype.fields` generates middleware that allows handling file uploads across multiple form fields, with each field accepting a defined number of files. Uploaded files are organized in `req.files` as an object where each key is a field name, and each value is an array of files for that field.
 *
 * - **File Handling Strategy**: Sets the `fileStrategy` to `'OBJECT'`, organizing files in `req.files` by field name.
 * - **Field-Specific Limits**: Each field can specify a `maxCount` to restrict the number of files for that particular field.
 *
 * @example
 * // Usage example:
 * const multer = require('multer');
 * const upload = multer({ dest: 'uploads/' });
 * 
 * app.post('/profile', upload.fields([
 *   { name: 'avatar', maxCount: 1 },
 *   { name: 'gallery', maxCount: 5 }
 * ]), (req, res) => {
 *   // Access uploaded files with req.files
 *   res.send(`Uploaded ${req.files['gallery'].length} gallery images successfully!`);
 * });
 *
 * @throws {MulterError} Throws `LIMIT_UNEXPECTED_FILE` if the number of uploaded files exceeds the specified `maxCount` for any field.
 */
Multer.prototype.fields = function (fields) {
  return this._makeMiddleware(fields, 'OBJECT')
}

/**
 * Creates middleware for handling form data without any file uploads.
 *
 * @returns {Function} Middleware function that processes only text fields and rejects any file uploads.
 *
 * @description
 * `Multer.prototype.none` generates middleware that processes only form fields without allowing any file uploads. 
 * If any file is uploaded, it will result in an error, as this middleware is strictly for text-based form submissions.
 *
 * - **File Handling Strategy**: Sets the `fileStrategy` to `'NONE'`, ensuring `req.files` will be empty.
 * - **Text-Only Forms**: Suitable for forms that only contain text fields.
 *
 * @example
 * // Usage example:
 * const multer = require('multer');
 * const upload = multer();
 * 
 * app.post('/submit', upload.none(), (req, res) => {
 *   // Access form fields through req.body
 *   res.send(`Received submission with name: ${req.body.name}`);
 * });
 *
 * @throws {MulterError} Throws `LIMIT_UNEXPECTED_FILE` if any file upload is attempted.
 */
Multer.prototype.none = function () {
  return this._makeMiddleware([], 'NONE')
}

/**
 * Creates middleware for handling any number of file uploads on any field name.
 *
 * @returns {Function} Middleware function that accepts files uploaded on any field name, storing them in `req.files` as an array.
 *
 * @description
 * `Multer.prototype.any` generates middleware that allows unlimited file uploads on any field, storing all files in `req.files` as an array. 
 * This middleware is flexible for forms where the field names for file uploads are dynamic or undefined in advance.
 *
 * - **File Handling Strategy**: Sets the `fileStrategy` to `'ARRAY'`, ensuring all uploaded files are appended to `req.files`.
 * - **Flexible Field Handling**: Accepts files on any field name, unlike `single`, `array`, or `fields`, which target specific fields.
 *
 * @example
 * // Usage example:
 * const multer = require('multer');
 * const upload = multer();
 * 
 * app.post('/upload', upload.any(), (req, res) => {
 *   // Access all uploaded files through req.files array
 *   res.send(`Uploaded ${req.files.length} files`);
 * });
 *
 * @throws {MulterError} Throws an error for any violations of size, count, or field limits as configured.
 */
Multer.prototype.any = function () {
  function setup () {
    return {
      limits: this.limits,
      preservePath: this.preservePath,
      storage: this.storage,
      fileFilter: this.fileFilter,
      fileStrategy: 'ARRAY'
    }
  }

  return makeMiddleware(setup.bind(this))
}

/**
 * Creates a new Multer instance for handling file uploads.
 *
 * @param {Object} [options] - Optional configuration options for the Multer instance.
 * @param {Object} [options.storage] - A custom storage engine, such as `diskStorage` or `memoryStorage`.
 * @param {String} [options.dest] - The destination directory for file uploads (if using disk storage).
 * @param {Object} [options.limits] - Limits for file upload size, field counts, etc.
 * @param {Boolean} [options.preservePath] - Whether to preserve the original file path.
 * @param {Function} [options.fileFilter] - A function to filter file uploads based on their attributes.
 * 
 * @returns {Multer} A new Multer instance configured with the provided options.
 * 
 * @throws {TypeError} Throws an error if the options argument is not an object.
 *
 * @example
 * // Example of using multer to handle file uploads:
 * const multer = require('multer');
 * 
 * // Using disk storage and custom file filter
 * const upload = multer({
 *   storage: multer.diskStorage({
 *     destination: function (req, file, cb) {
 *       cb(null, 'uploads/')
 *     },
 *     filename: function (req, file, cb) {
 *       cb(null, Date.now() + path.extname(file.originalname))
 *     }
 *   }),
 *   limits: { fileSize: 10 * 1024 * 1024 },  // 10MB limit
 *   fileFilter: function (req, file, cb) {
 *     if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
 *       cb(null, true);  // Accept file
 *     } else {
 *       cb(new Error('Only JPEG and PNG files are allowed'), false);  // Reject file
 *     }
 *   }
 * });
 * 
 * app.post('/upload', upload.single('image'), (req, res) => {
 *   res.send('File uploaded!');
 * });
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
