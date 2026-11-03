/* eslint-env mocha */

var assert = require('assert')

var fs = require('fs')
var path = require('path')
var os = require('os')
var util = require('./_util')
var multer = require('../')
var temp = require('fs-temp')
var rimraf = require('rimraf')
var FormData = require('form-data')

function assertFileProperties (file, expectedFieldname, expectedOriginalname) {
  const expectedSize = util.fileSizeByName(expectedOriginalname)
  assert.strictEqual(file.fieldname, expectedFieldname)
  assert.strictEqual(file.originalname, expectedOriginalname)
  assert.strictEqual(file.size, expectedSize)
  assert.strictEqual(util.fileSize(file.path), expectedSize)
}

describe('Disk Storage', function () {
  var uploadDir, upload

  beforeEach(function (done) {
    temp.mkdir(function (err, path) {
      if (err) return done(err)

      uploadDir = path
      upload = multer({ dest: path })
      done()
    })
  })

  afterEach(function (done) {
    rimraf(uploadDir, done)
  })

  describe('flush option', function () {
    var fsyncCalls
    var originalFsync

    beforeEach(function () {
      fsyncCalls = 0
      originalFsync = fs.fsync
      fs.fsync = function (fd, cb) {
        fsyncCalls++

        originalFsync(fd, cb)
      }
    })

    afterEach(function () {
      fs.fsync = originalFsync
    })

    it('should not call fsync unless flush is enabled', function (done) {
      var form = new FormData()
      var parser = multer({ dest: uploadDir }).single('small0')

      form.append('small0', util.file('small0.dat'))

      util.submitForm(parser, form, function (err, req) {
        assert.ifError(err)

        assert.strictEqual(fsyncCalls, 0)
        assertFileProperties(req.file, 'small0', 'small0.dat')

        done()
      })
    })

    it('should call fsync once when flush is enabled', function (done) {
      var form = new FormData()
      var storage = multer.diskStorage({ destination: uploadDir, flush: true })
      var parser = multer({ storage: storage }).single('small0')

      form.append('small0', util.file('small0.dat'))

      util.submitForm(parser, form, function (err, req) {
        assert.ifError(err)

        assert.strictEqual(fsyncCalls, 1)
        assertFileProperties(req.file, 'small0', 'small0.dat')

        done()
      })
    })

    describe('flush errors', function () {
      var storage
      var originalOpen
      var originalClose
      var originalUnlink

      function submitFile (cb) {
        var form = new FormData()
        var parser = multer({ storage: storage }).single('small0')

        form.append('small0', util.file('small0.dat'))
        util.submitForm(parser, form, cb)
      }

      function assertFlushError (err, expectedError) {
        assert.strictEqual(err, expectedError)
        assert.deepStrictEqual(err.storageErrors, [])
        assert.deepStrictEqual(util.readDir(uploadDir), [])
      }

      beforeEach(function () {
        originalOpen = fs.open
        originalClose = fs.close
        originalUnlink = fs.unlink
        storage = multer.diskStorage({ destination: uploadDir, flush: true })
      })

      afterEach(function () {
        fs.open = originalOpen
        fs.close = originalClose
        fs.unlink = originalUnlink
      })

      it('should remove the uploaded file when fsync fails', function (done) {
        var syncError = new Error('EIO: simulated fsync failure')
        var sizeAtFsync

        syncError.code = 'EIO'
        syncError.syscall = 'fsync'

        fs.fsync = function (fd, cb) {
          fsyncCalls++
          sizeAtFsync = fs.fstatSync(fd).size
          process.nextTick(function () { cb(syncError) })
        }

        submitFile(function (err) {
          assert.strictEqual(fsyncCalls, 1)
          assert.strictEqual(sizeAtFsync, util.fileSizeByName('small0.dat'))
          assertFlushError(err, syncError)
          done()
        })
      })

      it('should remove the uploaded file when the flush open fails', function (done) {
        var openError = new Error('EIO: simulated flush open failure')
        openError.code = 'EIO'

        fs.open = function (path, flags, cb) {
          if (flags === 'r+') return process.nextTick(function () { cb(openError) })
          return originalOpen.apply(fs, arguments)
        }

        submitFile(function (err) {
          assertFlushError(err, openError)
          done()
        })
      })

      it('should remove the uploaded file when the flush close fails', function (done) {
        var closeError = new Error('EIO: simulated flush close failure')
        closeError.code = 'EIO'

        fs.fsync = function (fd, cb) {
          // Inject a close error only for the flush descriptor. Close the
          // real descriptor first so the test itself cannot leak it.
          fs.close = function (closeFd, closeCb) {
            if (closeFd !== fd) return originalClose.apply(fs, arguments)
            originalClose(closeFd, function (err) {
              closeCb(err || closeError)
            })
          }
          process.nextTick(cb)
        }

        submitFile(function (err) {
          assertFlushError(err, closeError)
          done()
        })
      })

      it('should not unlink twice when a request aborts during a failed flush', function (done) {
        var syncError = new Error('EIO: simulated fsync failure')
        var request
        var unlinkCalls = 0
        var handleCalls = 0
        var originalHandle = storage._handleFile
        syncError.code = 'EIO'

        // Wait for both storage and middleware to finish, without a timer.
        storage._handleFile = function (req, file, cb) {
          request = req
          originalHandle.call(this, req, file, function (err, info) {
            handleCalls++
            assert.strictEqual(err, syncError)
            cb(err, info)
          })
        }
        fs.fsync = function (fd, cb) {
          request.emit('aborted')
          process.nextTick(function () { cb(syncError) })
        }
        fs.unlink = function (path, cb) {
          unlinkCalls++
          originalUnlink(path, cb)
        }

        submitFile(function (err) {
          assert.strictEqual(err.message, 'Request aborted')
          assert.strictEqual(handleCalls, 1)
          assert.strictEqual(unlinkCalls, 1)
          assert.deepStrictEqual(err.storageErrors, [])
          assert.deepStrictEqual(util.readDir(uploadDir), [])
          done()
        })
      })
    })
  })

  it('should process parser/form-data POST request', function (done) {
    var form = new FormData()
    var parser = upload.single('small0')

    form.append('name', 'Multer')
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.body.name, 'Multer')

      assertFileProperties(req.file, 'small0', 'small0.dat')

      done()
    })
  })

  it('should process empty fields and an empty file', function (done) {
    var form = new FormData()
    var parser = upload.single('empty')

    form.append('empty', util.file('empty.dat'))
    form.append('name', 'Multer')
    form.append('version', '')
    form.append('year', '')
    form.append('checkboxfull', 'cb1')
    form.append('checkboxfull', 'cb2')
    form.append('checkboxhalfempty', 'cb1')
    form.append('checkboxhalfempty', '')
    form.append('checkboxempty', '')
    form.append('checkboxempty', '')

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.body.name, 'Multer')
      assert.strictEqual(req.body.version, '')
      assert.strictEqual(req.body.year, '')

      assert.deepStrictEqual(req.body.checkboxfull, ['cb1', 'cb2'])
      assert.deepStrictEqual(req.body.checkboxhalfempty, ['cb1', ''])
      assert.deepStrictEqual(req.body.checkboxempty, ['', ''])

      assertFileProperties(req.file, 'empty', 'empty.dat')

      done()
    })
  })

  it('should process multiple files', function (done) {
    var form = new FormData()
    var parser = upload.fields([
      { name: 'empty', maxCount: 1 },
      { name: 'tiny0', maxCount: 1 },
      { name: 'tiny1', maxCount: 1 },
      { name: 'small0', maxCount: 1 },
      { name: 'small1', maxCount: 1 },
      { name: 'medium', maxCount: 1 },
      { name: 'large', maxCount: 1 }
    ])

    form.append('empty', util.file('empty.dat'))
    form.append('tiny0', util.file('tiny0.dat'))
    form.append('tiny1', util.file('tiny1.dat'))
    form.append('small0', util.file('small0.dat'))
    form.append('small1', util.file('small1.dat'))
    form.append('medium', util.file('medium.dat'))
    form.append('large', util.file('large.jpg'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.deepStrictEqual(req.body, util.toNullProtoDeep({}))

      assertFileProperties(req.files.empty[0], 'empty', 'empty.dat')
      assertFileProperties(req.files.tiny0[0], 'tiny0', 'tiny0.dat')
      assertFileProperties(req.files.tiny1[0], 'tiny1', 'tiny1.dat')
      assertFileProperties(req.files.small0[0], 'small0', 'small0.dat')
      assertFileProperties(req.files.small1[0], 'small1', 'small1.dat')
      assertFileProperties(req.files.medium[0], 'medium', 'medium.dat')
      assertFileProperties(req.files.large[0], 'large', 'large.jpg')

      done()
    })
  })

  it('should remove uploaded files on error', function (done) {
    var form = new FormData()
    var parser = upload.single('tiny0')

    form.append('tiny0', util.file('tiny0.dat'))
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.strictEqual(err.field, 'small0')
      assert.deepStrictEqual(err.storageErrors, [])

      assert.deepStrictEqual(util.readDir(uploadDir), [])

      done()
    })
  })

  it('should report error when directory doesn\'t exist', function (done) {
    var directory = path.join(temp.mkdirSync(), 'ghost')
    function dest ($0, $1, cb) { cb(null, directory) }

    var storage = multer.diskStorage({ destination: dest })
    var upload = multer({ storage: storage })
    var parser = upload.single('tiny0')
    var form = new FormData()

    form.append('tiny0', util.file('tiny0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.strictEqual(err.code, 'ENOENT')
      assert.strictEqual(path.dirname(err.path), directory)

      done()
    })
  })

  it('should use default destination when none is provided', function (done) {
    var storage = multer.diskStorage({})
    var upload = multer({ storage: storage })
    var parser = upload.single('file')
    var form = new FormData()

    form.append('file', util.file('small0.dat'))

    util.submitForm(parser, form, (err, req) => {
      assert.ifError(err)

      // Verify that the file was stored in the system's temporary directory
      assert.strictEqual(path.dirname(req.file.path), os.tmpdir())

      fs.unlink(req.file.path, done)
    })
  })

  it('should use default destination and filename when options are omitted', function (done) {
    var storage = multer.diskStorage()
    var upload = multer({ storage: storage })
    var parser = upload.single('file')
    var form = new FormData()

    form.append('file', util.file('small0.dat'))

    util.submitForm(parser, form, (err, req) => {
      assert.ifError(err)

      // Verify that the file was stored in the system's temporary directory
      assert.strictEqual(path.dirname(req.file.path), os.tmpdir())
      assert.strictEqual(req.file.size, util.fileSizeByName('small0.dat'))

      fs.unlink(req.file.path, done)
    })
  })

  it('should handle error in getDestination', function (done) {
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(new Error('Test getDestination error'))
      }
    })
    var upload = multer({ storage: storage })
    var parser = upload.single('file')
    var form = new FormData()

    form.append('file', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert(err)
      assert.strictEqual(err.message, 'Test getDestination error')
      done()
    })
  })

  it('should handle error in getFilename', function (done) {
    var storage = multer.diskStorage({
      filename: function (req, file, cb) {
        cb(new Error('Test getFilename error'))
      }
    })
    var upload = multer({ storage: storage })
    var parser = upload.single('file')
    var form = new FormData()

    form.append('file', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert(err)
      assert.strictEqual(err.message, 'Test getFilename error')
      done()
    })
  })

  it('should handle case where fieldname and originalname did not match', function (done) {
    var form = new FormData()
    var parser = upload.single('profilePic')

    form.append('profilePic', util.file('large.jpg'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assertFileProperties(req.file, 'profilePic', 'large.jpg')

      done()
    })
  })
})
