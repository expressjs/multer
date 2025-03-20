var objectAssign = require('object-assign')

/**
 * Removes a specific item from an array.
 * @param {Array} arr - The array to remove the item from.
 * @param {*} item - The item to remove.
 */
function arrayRemove (arr, item) {
  var idx = arr.indexOf(item)
  if (~idx) arr.splice(idx, 1)
}

/**
 * Handles file storage strategies within a request, providing flexible 
 * storage options for file uploads by managing different data structures 
 * (none, single value, array, or object).
 * @param {string} strategy - The file storage strategy: 'NONE', 'VALUE', 'ARRAY', or 'OBJECT'.
 * @param {Object} req - The request object that will store the files.
 * @throws Will throw an error for an unknown file strategy.
 */
function FileAppender (strategy, req) {
  this.strategy = strategy
  this.req = req

  switch (strategy) {
    case 'NONE': break
    case 'VALUE': break
    case 'ARRAY': req.files = []; break
    case 'OBJECT': req.files = Object.create(null); break
    default: throw new Error('Unknown file strategy: ' + strategy)
  }
}

/**
 * Inserts a placeholder for a file based on the current strategy.
 * @param {Object} file - The file object with at least a fieldname property.
 * @returns {Object} The placeholder object for the file.
 */
FileAppender.prototype.insertPlaceholder = function (file) {
  var placeholder = {
    fieldname: file.fieldname
  }

  switch (this.strategy) {
    case 'NONE': break
    case 'VALUE': break
    case 'ARRAY': this.req.files.push(placeholder); break
    case 'OBJECT':
      if (this.req.files[file.fieldname]) {
        this.req.files[file.fieldname].push(placeholder)
      } else {
        this.req.files[file.fieldname] = [placeholder]
      }
      break
  }

  return placeholder
}

/**
 * Removes a placeholder for a file from the request.
 * @param {Object} placeholder - The placeholder object to remove.
 */
FileAppender.prototype.removePlaceholder = function (placeholder) {
  switch (this.strategy) {
    case 'NONE': break
    case 'VALUE': break
    case 'ARRAY': arrayRemove(this.req.files, placeholder); break
    case 'OBJECT':
      if (this.req.files[placeholder.fieldname].length === 1) {
        delete this.req.files[placeholder.fieldname]
      } else {
        arrayRemove(this.req.files[placeholder.fieldname], placeholder)
      }
      break
  }
}

/**
 * Replaces a placeholder object with a complete file object.
 * For 'VALUE' strategy, assigns the file directly to req.file.
 * @param {Object} placeholder - The placeholder object to be replaced.
 * @param {Object} file - The complete file object with all properties.
 */
FileAppender.prototype.replacePlaceholder = function (placeholder, file) {
  if (this.strategy === 'VALUE') {
    this.req.file = file
    return
  }

  delete placeholder.fieldname
  objectAssign(placeholder, file)
}

module.exports = FileAppender
