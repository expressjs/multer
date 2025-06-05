const concat = require('concat-stream')

class MemoryStorage {
  constructor (opts = {}) {
    this.opts = opts
  }

  _handleFile (req, file, cb) {
    const concatStream = concat({ encoding: 'buffer' }, (data) => {
      cb(null, {
        buffer: data,
        size: data.length
      })
    })

    file.stream.on('error', (err) => cb(err))
    file.stream.pipe(concatStream)
  }

  _removeFile (req, file, cb) {
    delete file.buffer
    cb(null)
  }
}

module.exports = (opts) => new MemoryStorage(opts)
