var fs = require('fs')
var os = require('os')
var path = require('path')
var crypto = require('crypto')

/**
 * Generates a unique filename for the uploaded file using random bytes.
 * 
 * @param {Object} req - The request object.
 * @param {Object} file - The file object.
 * @param {Function} cb - A callback function to return the generated filename.
 */
function getFilename (req, file, cb) {
  crypto.randomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'))
  })
}

/**
 * Determines the destination directory for the uploaded file.
 * Defaults to the system's temporary directory.
 * 
 * @param {Object} req - The request object.
 * @param {Object} file - The file object.
 * @param {Function} cb - A callback function to return the destination directory.
 */
function getDestination (req, file, cb) {
  cb(null, os.tmpdir())
}

/**
 * DiskStorage class for handling file uploads to the disk.
 * @param {Object} opts - Configuration options for the DiskStorage.
 * @param {Function} [opts.filename] - A custom function for generating the filename.
 * @param {string|Function} [opts.destination] - A custom destination path or function to determine the destination.
 */
function DiskStorage (opts) {
  this.getFilename = (opts.filename || getFilename)

  if (typeof opts.destination === 'string') {
    fs.mkdirSync(opts.destination, { recursive: true })
    this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
  } else {
    this.getDestination = (opts.destination || getDestination)
  }
}

/**
 * Handles the file processing (saving the file to disk).
 * 
 * @param {Object} req - The request object.
 * @param {Object} file - The file object.
 * @param {Function} cb - A callback function that will be invoked once the file is saved.
 * It receives two arguments:
 *   - `err` (null if no error occurred)
 *   - `info` (an object containing the file's `destination`, `filename`, `path`, and `size`)
 */
DiskStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  var that = this

  // Determine the destination directory
  that.getDestination(req, file, function (err, destination) {
    if (err) return cb(err)

    // Generate a unique filename
    that.getFilename(req, file, function (err, filename) {
      if (err) return cb(err)

      var finalPath = path.join(destination, filename)
      var outStream = fs.createWriteStream(finalPath)

      // Pipe the file stream to the file output stream
      file.stream.pipe(outStream)
      outStream.on('error', cb)
      outStream.on('finish', function () {
        // File successfully saved, return the file info
        cb(null, {
          destination: destination,
          filename: filename,
          path: finalPath,
          size: outStream.bytesWritten
        })
      })
    })
  })
}

/**
 * Removes a file from the disk.
 * 
 * @param {Object} req - The request object.
 * @param {Object} file - The file object to be removed.
 * @param {Function} cb - A callback function to be invoked after the file is removed.
 */
DiskStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  var path = file.path

  // Remove file-related properties
  delete file.destination
  delete file.filename
  delete file.path

  // Delete the file from disk
  fs.unlink(path, cb)
}

/**
 * Factory function to create a new DiskStorage instance with the given options.
 * 
 * @param {Object} opts - Configuration options for the DiskStorage.
 * @returns {DiskStorage} A new instance of the DiskStorage class.
 */
module.exports = function (opts) {
  return new DiskStorage(opts)
}
