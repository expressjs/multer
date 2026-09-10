/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var stream = require('stream')

var multer = require('../')
var rimraf = require('rimraf')
var temp = require('fs-temp')

// DiskStorage with `flush: true` reopens the just-written file for an fsync after
// the write stream has closed. That second descriptor must be released before an
// aborted request unlinks the file, otherwise cleanup races an open descriptor
// (harmless on POSIX, an orphaned file on filesystems that refuse to unlink an
// open file). These tests assert the ordering directly: while the flush is in
// progress the file must still be on disk, and it is unlinked only once the flush
// descriptor has been closed.

// Node.js 10.16 predates stream.Readable.from, so build the source streams by hand
// to stay compatible with the minimum supported version.
function finiteStream () {
  var readable = new stream.Readable()
  readable._read = function () {}
  readable.push(Buffer.alloc(8 * 1024, 0x5a))
  readable.push(null)
  return readable
}

function idleStream () {
  var readable = new stream.Readable()
  readable._read = function () {}
  return readable
}

function makeFile (source) {
  var file = {
    fieldname: 'file',
    originalname: 'flush.bin',
    encoding: '7bit',
    mimetype: 'application/octet-stream'
  }

  Object.defineProperty(file, 'stream', {
    configurable: true,
    enumerable: false,
    value: source
  })

  return file
}

describe('disk storage flush cleanup on aborted uploads', function () {
  var uploadDir
  var realFsync = fs.fsync
  var realOpen = fs.open
  var realCreateWriteStream = fs.createWriteStream

  beforeEach(function (done) {
    temp.mkdir(function (err, dir) {
      if (err) return done(err)

      uploadDir = dir
      done()
    })
  })

  afterEach(function (done) {
    fs.fsync = realFsync
    fs.open = realOpen
    fs.createWriteStream = realCreateWriteStream
    rimraf(uploadDir, done)
  })

  it('should defer the abort unlink until the flush descriptor is closed', function (done) {
    this.timeout(5000)

    var storage = multer.diskStorage({ destination: uploadDir, flush: true })
    var req = {}
    var file = makeFile(finiteStream())
    var removeCalled = false
    var removeError
    var filesDuringFlush = null
    var triggered = false

    // The abort cleanup lands while the flush descriptor is open. A correct
    // implementation defers the unlink, so the file must still be on disk when
    // checked here, before the flush is allowed to complete.
    fs.fsync = function (fd, cb) {
      if (triggered) return realFsync.call(fs, fd, cb)
      triggered = true

      storage._removeFile(req, file, function (err) {
        removeCalled = true
        removeError = err
      })

      setTimeout(function () {
        filesDuringFlush = fs.readdirSync(uploadDir).length
        realFsync.call(fs, fd, cb)
      }, 50)
    }

    storage._handleFile(req, file, function (err) {
      assert.ifError(err)

      setTimeout(function () {
        assert.strictEqual(filesDuringFlush, 1, 'file was unlinked while the flush descriptor was still open')
        assert.ok(removeCalled, '_removeFile callback never fired (cleanup hung)')
        assert.ifError(removeError)
        assert.strictEqual(fs.readdirSync(uploadDir).length, 0, 'file was not removed after the flush completed')
        done()
      }, 100)
    })
  })

  it('should unlink immediately when the flush has already completed', function (done) {
    this.timeout(5000)

    var storage = multer.diskStorage({ destination: uploadDir, flush: true })
    var req = {}
    var file = makeFile(finiteStream())

    storage._handleFile(req, file, function (err) {
      assert.ifError(err)

      storage._removeFile(req, file, function (err) {
        assert.ifError(err)
        assert.strictEqual(fs.readdirSync(uploadDir).length, 0, 'file not removed after flush')
        done()
      })
    })
  })

  it('should release a pending abort cleanup when the abort lands during an in-progress write', function (done) {
    this.timeout(5000)

    var storage = multer.diskStorage({ destination: uploadDir, flush: true })
    var req = {}
    var file = makeFile(idleStream())
    var removeCalled = false
    var triggered = false

    // Land the abort while the write stream is still open (before it finishes),
    // exercising the write-stream wait path with flush enabled.
    fs.createWriteStream = function () {
      var out = realCreateWriteStream.apply(fs, arguments)

      if (!triggered) {
        triggered = true
        process.nextTick(function () {
          storage._removeFile(req, file, function () { removeCalled = true })
        })
      }

      return out
    }

    storage._handleFile(req, file, function () {
      setTimeout(function () {
        assert.ok(removeCalled, 'pending abort cleanup hung during an in-progress write')
        assert.strictEqual(fs.readdirSync(uploadDir).length, 0, 'orphan file after abort during write')
        done()
      }, 200)
    })
  })

  it('should release a pending abort cleanup even if the flush reopen fails', function (done) {
    this.timeout(5000)

    var storage = multer.diskStorage({ destination: uploadDir, flush: true })
    var req = {}
    var file = makeFile(finiteStream())
    var removeCalled = false
    var triggered = false

    // Force the flush reopen to fail, landing the abort cleanup in the same
    // window so the failure path must still release the pending unlink.
    fs.open = function (p, flags, cb) {
      if (!triggered && flags === 'r+') {
        triggered = true
        fs.open = realOpen

        storage._removeFile(req, file, function () { removeCalled = true })

        var err = new Error('EACCES: simulated flush open failure')
        err.code = 'EACCES'
        return process.nextTick(function () { cb(err) })
      }

      return realOpen.apply(fs, arguments)
    }

    storage._handleFile(req, file, function (err) {
      assert.ok(err, 'expected the forced flush open error')

      setTimeout(function () {
        assert.ok(removeCalled, 'pending abort cleanup hung after flush open failure')
        done()
      }, 200)
    })
  })
})
