const Writable = require('stream').Writable
const Buffer = require('buffer').Buffer
const isUint8Array = require('util').types.isUint8Array

class MemoryStorage {
  _handleFile (req, file, cb) {
    file.stream.pipe(
      new ConcatStream(function (data) {
        cb(null, {
          buffer: data,
          size: data.length
        })
      })
    )
  }

  _removeFile (req, file, cb) {
    delete file.buffer
    cb(null)
  }
}

module.exports = function () {
  return new MemoryStorage()
}

/**
 * Writable stream that concatenates all written chunks into a single Buffer.
 *
 * Implementation inspired by the concat-stream npm package (https://www.npmjs.com/package/concat-stream),
 * modified for our specific use case.
 */
class ConcatStream extends Writable {
  /**
   * Creates a new ConcatStream instance.
   * @param {function(Buffer): void} cb - Callback invoked with the concatenated Buffer when the stream finishes.
   */
  constructor (cb) {
    super()
    this.body = []
    this.on('finish', function () {
      cb(this.getBody())
    })
  }

  _write (chunk, enc, next) {
    this.body.push(chunk)
    next()
  }

  /**
   * Concatenates all collected chunks into a single Buffer.
   * @returns {Buffer} The concatenated buffer containing all written data.
   */
  getBody () {
    const bufs = []
    for (const p of this.body) {
      // Buffer.concat can handle Buffer and Uint8Array (and subclasses)
      if (Buffer.isBuffer(p) || isUint8Array(p)) {
        bufs.push(p)
      } else if (isBufferish(p)) {
        bufs.push(Buffer.from(p))
      } else {
        bufs.push(Buffer.from(String(p)))
      }
    }
    return Buffer.concat(bufs)
  }
}

/**
 * Checks if the given value is array-like.
 * @param {*} arr
 * @returns {boolean}
 */
function isArrayish (arr) {
  return /Array\]$/.test(Object.prototype.toString.call(arr))
}

/**
 * Checks if the given value is Buffer-like.
 * @param {*} p
 * @returns {boolean}
 */
function isBufferish (p) {
  return (
    typeof p === 'string' ||
    isArrayish(p) ||
    (p && typeof p.subarray === 'function')
  )
}
