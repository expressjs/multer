/**
 * Removes uploaded files from the server.
 * This function processes each uploaded file and removes them one by one,
 * collecting any errors encountered during the removal process.
 * 
 * @param {Array} uploadedFiles - An array of uploaded files that need to be removed.
 * @param {Function} remove - A function that removes a file. It takes a file and a callback function as arguments.
 * @param {Function} cb - A callback function to be called after all files have been processed. 
 * It receives two arguments:
 *   - `err` (null if no errors)
 *   - `errors` (an array of errors that occurred during the removal process)
 */
function removeUploadedFiles (uploadedFiles, remove, cb) {
  var length = uploadedFiles.length
  var errors = []

  // If no files to remove, immediately invoke the callback with an empty error array
  if (length === 0) return cb(null, errors)

  /**
   * Recursively handles the removal of each file in the uploadedFiles array.
   * @param {number} idx - The index of the file to remove.
   */
  function handleFile (idx) {
    var file = uploadedFiles[idx]

    remove(file, function (err) {
      if (err) {
        // Attach file-specific information to the error object
        err.file = file
        err.field = file.fieldname
        errors.push(err)
      }

      // Proceed to the next file if there are more, otherwise call the callback
      if (idx < length - 1) {
        handleFile(idx + 1)
      } else {
        cb(null, errors)
      }
    })
  }

  // Start processing the files from the first index
  handleFile(0)
}

module.exports = removeUploadedFiles
