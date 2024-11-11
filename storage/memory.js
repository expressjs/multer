var concat = require('concat-stream')

/**
 * MemoryStorage class for handling file uploads directly into memory (buffer).
 * 
 * @param {Object} opts - Configuration options for the MemoryStorage.
 */
function MemoryStorage (opts) {}

/**
 * Handles the file processing (storing the file in memory as a buffer).
 * 
 * @param {Object} req - The request object.
 * @param {Object} file - The file object.
 * @param {Function} cb - A callback function that will be invoked once the file is processed.
 * It receives two arguments:
 *   - `err` (null if no error occurred)
 *   - `info` (an object containing the `buffer` and `size` of the file)
 */
MemoryStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  // Concatenate the file stream data into a buffer
  file.stream.pipe(concat({ encoding: 'buffer' }, function (data) {
    // Return the file buffer and its size
    cb(null, {
      buffer: data,
      size: data.length
    })
  }))
}

/**
 * Removes a file from memory.
 * 
 * @param {Object} req - The request object.
 * @param {Object} file - The file object to be removed.
 * @param {Function} cb - A callback function to be invoked after the file is removed.
 */
MemoryStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  // Remove the file's buffer from memory
  delete file.buffer
  cb(null)
}

/**
 * Factory function to create a new MemoryStorage instance with the given options.
 * 
 * @param {Object} opts - Configuration options for the MemoryStorage.
 * @returns {MemoryStorage} A new instance of the MemoryStorage class.
 */
module.exports = function (opts) {
  return new MemoryStorage(opts)
}
