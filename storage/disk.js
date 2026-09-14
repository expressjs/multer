var fs = require('fs')
var os = require('os')
var path = require('path')
var crypto = require('crypto')
var pipeline = require('stream').pipeline
var MulterError = require('../lib/multer-error')

// Write streams still open for a file, so _removeFile can wait for the
// descriptor to be closed before unlinking (Windows refuses to unlink open files).
var openStreams = new WeakMap()

// Files being flushed with a second descriptor opened after the write stream
// closed, so _removeFile can wait for it too before unlinking (see openStreams).
var flushingFiles = new WeakMap()

function endFlush (file) {
  var flush = flushingFiles.get(file)
  if (!flush) return

  flushingFiles.delete(file)
  if (flush.onClosed) flush.onClosed()
}

function getFilename (req, file, cb) {
  crypto.randomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'))
  })
}

function getDestination (req, file, cb) {
  cb(null, os.tmpdir())
}

/**
 * Storage engine that writes files to disk.
 *
 * @constructor
 * @private
 * @param {Object} opts
 * @param {string|function(Object, File, function(?Error, string=): void): void} [opts.destination]
 *   Folder to store files in, or a function that calls back with one. Defaults to `os.tmpdir()`
 * @param {function(Object, File, function(?Error, string=): void): void} [opts.filename]
 *   Calls back with the file name to use. Defaults to a random hex name without extension
 * @param {boolean} [opts.flush=false] fsync the file before calling back
 */
function DiskStorage (opts) {
  opts = opts || {}

  this.getFilename = (opts.filename || getFilename)
  this.flush = opts.flush

  if (typeof opts.destination === 'string') {
    fs.mkdirSync(opts.destination, { recursive: true })
    this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
  } else {
    this.getDestination = (opts.destination || getDestination)
  }
}

DiskStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  var that = this

  that.getDestination(req, file, function (err, destination) {
    if (err) return cb(err)

    that.getFilename(req, file, function (err, filename) {
      if (err) return cb(err)

      var finalPath = path.join(destination, filename)

      if (file.stream.destroyed) return cb(new MulterError('STREAM_DESTROYED'))

      var outStream = fs.createWriteStream(finalPath)

      file.path = finalPath
      openStreams.set(file, outStream)
      outStream.once('close', function () { openStreams.delete(file) })

      // Register the file as flushing before the write stream can close, so an
      // abort landing while the stream is finishing still waits for the upcoming
      // flush descriptor. endFlush runs on every pipeline outcome to release it.
      if (that.flush) flushingFiles.set(file, {})

      pipeline(file.stream, outStream, function (err) {
        if (err) {
          endFlush(file)
          return cb(err)
        }

        var done = function (err) {
          if (err) return cb(err)

          cb(null, {
            destination: destination,
            filename: filename,
            path: finalPath,
            size: outStream.bytesWritten
          })
        }

        if (!that.flush) return done()

        // The write stream's descriptor is already closed by the time
        // 'finish' fires on some Node.js versions, so open the file again
        // to flush it. fsync applies to the file, not to a specific
        // descriptor, so this is equivalent and works everywhere.
        fs.open(finalPath, 'r+', function (err, fd) {
          if (err) {
            endFlush(file)
            return done(err)
          }

          fs.fsync(fd, function (syncErr) {
            fs.close(fd, function (closeErr) {
              endFlush(file)
              done(syncErr || closeErr)
            })
          })
        })
      })
    })
  })
}

DiskStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  var path = file.path

  delete file.destination
  delete file.filename
  delete file.path

  // The flush reopen (see _handleFile) opens a descriptor after the write stream
  // closed, so openStreams no longer tracks the file though one may still be open.
  // Defer the unlink until any in-progress flush has finished.
  function unlink () {
    var flush = flushingFiles.get(file)
    if (!flush) return fs.unlink(path, cb)

    flush.onClosed = function () { fs.unlink(path, cb) }
  }

  var outStream = openStreams.get(file)
  if (!outStream) return unlink()

  // `closed` is set when the descriptor is closed on every supported Node.js
  // version, whereas 'close' is not emitted after a write stream is destroyed
  // with an error on Node.js < 14 (emitClose defaults to false there), so wait
  // for 'close' or 'error', whichever comes first. destroy() is a no-op if the
  // stream is already being torn down.
  if (outStream.closed) return unlink()

  function onReleased () {
    outStream.removeListener('close', onReleased)
    outStream.removeListener('error', onReleased)
    unlink()
  }

  outStream.once('close', onReleased)
  outStream.once('error', onReleased)
  outStream.destroy()
}

/**
 * Create a disk storage engine. Sets `destination`, `filename` and `path` on
 * the file object.
 *
 * @param {Object} opts See {@link DiskStorage}
 * @returns {DiskStorage}
 */
module.exports = function (opts) {
  return new DiskStorage(opts)
}
