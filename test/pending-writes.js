/* eslint-env mocha */

var assert = require('assert')
var fs = require('fs')
var path = require('path')

var multer = require('../')
var util = require('./_util')
var temp = require('fs-temp')
var rimraf = require('rimraf')
var FormData = require('form-data')

// A file's error can be reported twice: via the stream 'error' event and via
// the storage callback (disk storage does this on aborted uploads). Each file
// must decrement pendingWrites at most once, or cleanup runs while another
// write is still in flight and leaves an orphan on disk.
describe('pending writes counter', function () {
  var uploadDir

  beforeEach(function (done) {
    temp.mkdir(function (err, dir) {
      if (err) return done(err)
      uploadDir = dir
      done()
    })
  })

  afterEach(function (done) {
    rimraf(uploadDir, done)
  })

  it('should wait for in-flight writes when another file reports its error twice', function (done) {
    var slowFileSettled = false

    var storage = {
      _handleFile: function (req, file, cb) {
        file.stream.resume()

        if (file.originalname === 'boom.dat') {
          // Simulate disk storage during an abort: the source stream errors,
          // then the write pipeline reports the same failure to the callback.
          var err = new Error('boom')
          setImmediate(function () {
            file.stream.emit('error', err)
            setImmediate(function () { cb(err) })
          })
          return
        }

        // Slow file: its write is still in flight while boom.dat errors.
        setTimeout(function () {
          var dest = path.join(uploadDir, 'slow.dat')
          fs.writeFile(dest, 'SLOW CONTENT', function (writeErr) {
            if (writeErr) return cb(writeErr)
            slowFileSettled = true
            cb(null, { path: dest })
          })
        }, 100)
      },
      _removeFile: function (req, file, cb) {
        fs.unlink(file.path, cb)
      }
    }

    var upload = multer({ storage: storage }).array('file', 2)

    var form = new FormData()
    form.append('file', Buffer.from('SLOW CONTENT'), 'slow.dat')
    form.append('file', Buffer.from('BOOM'), 'boom.dat')

    util.submitForm(upload, form, function (err) {
      assert.ok(err, 'middleware should fail')
      assert.strictEqual(err.message, 'boom')

      // The middleware must not report the error until every pending write
      // has settled; finishing early means cleanup missed the slow file.
      assert.strictEqual(slowFileSettled, true,
        'middleware finished while a write was still in flight (pendingWrites double decrement)')

      // Give any stray late write a chance to land, then check for orphans.
      setTimeout(function () {
        var files = fs.readdirSync(uploadDir)
        assert.strictEqual(files.length, 0, 'orphan files left behind: ' + files.join(', '))
        done()
      }, 200)
    })
  })
})
