const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const mkdirp = require('mkdirp')
const { promisify } = require('util')

const randomBytes = promisify(crypto.randomBytes)
const unlink = promisify(fs.unlink)

function getFilename (req, file) {
  return randomBytes(16).then((raw) => raw.toString('hex'))
}

function getDestination (req, file) {
  return Promise.resolve(os.tmpdir())
}

class DiskStorage {
  constructor (opts = {}) {
    this.getFilename = opts.filename || getFilename
    this.maxSize = opts.maxSize || Infinity

    if (typeof opts.destination === 'string') {
      mkdirp.sync(opts.destination)
      this.getDestination = function () {
        return Promise.resolve(opts.destination)
      }
    } else {
      this.getDestination = opts.destination || getDestination
    }
  }

  async _handleFile (req, file, cb) {
    try {
      const destination = await this.getDestination(req, file)
      const filename = await this.getFilename(req, file)
      const finalPath = path.join(destination, filename)
      const outStream = fs.createWriteStream(finalPath)

      let bytesWritten = 0

      // Track the file size and reject if it exceeds the maxSize
      file.stream.on('data', (chunk) => {
        bytesWritten += chunk.length
        if (bytesWritten > this.maxSize) {
          file.stream.destroy() // Stop the upload
          outStream.destroy() // Ensure the output stream is also closed
          return cb(new Error('File exceeds maximum size'))
        }
      })

      // Handle errors from file.stream
      file.stream.on('error', cb)

      file.stream.pipe(outStream)

      outStream.on('error', cb)
      outStream.on('finish', function () {
        cb(null, {
          destination: destination,
          filename: filename,
          path: finalPath,
          size: bytesWritten
        })
      })
    } catch (err) {
      cb(err)
    }
  }

  async _removeFile (req, file, cb) {
    try {
      await unlink(file.path)
      delete file.destination
      delete file.filename
      delete file.path
      cb(null)
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = (opts) => new DiskStorage(opts)
