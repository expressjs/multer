function createFileAppender (strategy, req) {
  switch (strategy) {
    case 'NONE': break
    case 'VALUE': req.file = null; break
    case 'ARRAY': req.files = []; break
    case 'OBJECT': req.files = Object.create(null); break
    default: throw new Error('Unknown file strategy: ' + strategy)
  }

  return function append (file) {
    switch (strategy) {
      case 'NONE': break
      case 'VALUE': req.file = file; break
      case 'ARRAY': req.files.push(file); break
      case 'OBJECT':
        if (req.files[file.fieldName]) {
          req.files[file.fieldName].push(file)
        } else {
          req.files[file.fieldName] = [file]
        }
        break
    }
  }
}

module.exports = createFileAppender
