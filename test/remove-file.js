/* eslint-env mocha */

var assert = require('assert')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

/**
 * Builds a custom storage engine that records the _handleFile and _removeFile calls.
 *
 * Answers the question in issue #1293: the info passed to _handleFile's
 * cb(null, info) is merged into the same file object (see fileInfo in
 * lib/make-middleware.js), so _removeFile receives those fields too.
 * These tests assert exactly that.
 */
function makeStorage () {
  var captured = {
    handleCalls: [],
    removeCalls: []
  }

  var storage = {
    _handleFile: function (req, file, cb) {
      captured.handleCalls.push(file.originalname)
      // Consume the source stream like a real engine and only call back once it
      // has ended (a stream truncated by the size limit never emits 'end')
      file.stream.on('data', function () {})
      file.stream.on('end', function () {
        // Return a custom path in the info object
        cb(null, { path: 'custom-' + file.originalname })
      })
    },

    _removeFile: function (req, file, cb) {
      captured.removeCalls.push(file)
      cb(null)
    }
  }

  return { storage: storage, captured: captured }
}

describe('_removeFile', function () {
  it('should not call _removeFile on a successful request', function (done) {
    var engine = makeStorage()
    var upload = multer({ storage: engine.storage })
    var form = new FormData()

    form.append('file', util.file('small0.dat'))

    util.submitForm(upload.single('file'), form, function (err) {
      assert.ifError(err)
      assert.strictEqual(engine.captured.handleCalls.length, 1)
      assert.strictEqual(engine.captured.removeCalls.length, 0)
      done()
    })
  })

  it('should call _removeFile with the merged file object when a later file exceeds the size limit', function (done) {
    var engine = makeStorage()
    var upload = multer({
      storage: engine.storage,
      limits: { fileSize: 100 }
    })
    var form = new FormData()

    // tiny1.dat is 7 bytes and is stored normally first
    form.append('files', util.file('tiny1.dat'))
    // tiny0.dat is 128 bytes, exceeds the limit and triggers the cleanup
    form.append('files', util.file('tiny0.dat'))

    util.submitForm(upload.array('files', 2), form, function (err) {
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')

      // Both files reached uploadedFiles: tiny1.dat was stored normally and
      // tiny0.dat exceeded the limit but its _handleFile had already completed
      // (the aborting branch still counts it), so both are cleaned up
      assert.strictEqual(engine.captured.handleCalls.length, 2)
      assert.strictEqual(engine.captured.removeCalls.length, 2)

      // The info returned by _handleFile must be merged into the file object
      // passed to _removeFile
      var removedPaths = engine.captured.removeCalls.map(function (f) {
        return f.path
      })
      assert.deepStrictEqual(removedPaths, [
        'custom-tiny1.dat',
        'custom-tiny0.dat'
      ])
      assert.strictEqual(engine.captured.removeCalls[0].fieldname, 'files')
      assert.strictEqual(
        engine.captured.removeCalls[0].originalname,
        'tiny1.dat'
      )
      done()
    })
  })

  it('should call _removeFile for stored files when fileFilter errors on a later file', function (done) {
    var engine = makeStorage()
    var upload = multer({
      storage: engine.storage,
      fileFilter: function (req, file, cb) {
        if (file.originalname === 'small0.dat') {
          return cb(null, true)
        }
        cb(new Error('rejected'))
      }
    })
    var form = new FormData()

    form.append('files', util.file('small0.dat'))
    form.append('files', util.file('tiny1.dat'))

    util.submitForm(upload.array('files', 2), form, function (err) {
      assert.strictEqual(err.message, 'rejected')

      // small0.dat was stored and must be cleaned up; tiny1.dat was rejected by
      // fileFilter and never stored
      assert.strictEqual(engine.captured.handleCalls.length, 1)
      assert.strictEqual(engine.captured.removeCalls.length, 1)
      assert.strictEqual(engine.captured.removeCalls[0].originalname, 'small0.dat')
      done()
    })
  })

  it('should call _removeFile on the memory storage engine when a later file exceeds the size limit', function (done) {
    var storage = multer.memoryStorage()
    var removeCalls = 0
    var originalRemove = storage._removeFile

    storage._removeFile = function (req, file, cb) {
      removeCalls++
      originalRemove.call(this, req, file, cb)
    }

    var upload = multer({
      storage: storage,
      limits: { fileSize: 100 }
    })
    var form = new FormData()

    form.append('files', util.file('tiny1.dat'))
    form.append('files', util.file('tiny0.dat'))

    util.submitForm(upload.array('files', 2), form, function (err) {
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')

      // Same as with the custom storage: both files in uploadedFiles are cleaned
      // up, and memory storage's _removeFile deletes each file.buffer
      assert.strictEqual(removeCalls, 2)
      done()
    })
  })
})
