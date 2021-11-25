/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var temp = require('fs-temp')
var rimraf = require('rimraf')
var FormData = require('form-data')

function generateFilename (req, file, cb) {
  cb(null, file.fieldname + file.originalname)
}

function startsWith (str, start) {
  return (str.substring(0, start.length) === start)
}

describe('Functionality', function () {
  var cleanup = []

  function makeStandardEnv (cb) {
    temp.mkdir(function (err, uploadDir) {
      if (err) return cb(err)

      cleanup.push(uploadDir)

      var storage = multer.diskStorage({
        destination: uploadDir,
        filename: generateFilename
      })

      cb(null, {
        upload: multer({ storage: storage }),
        uploadDir: uploadDir,
        form: new FormData()
      })
    })
  }

  after(function () {
    while (cleanup.length) rimraf.sync(cleanup.pop())
  })

  it('should upload the file to the `dest` dir', function (done) {
    makeStandardEnv(function (err, env) {
      if (err) return done(err)

      var parser = env.upload.single('small0')
      env.form.append('small0', util.file('small0.dat'))

      util.submitForm(parser, env.form, function (err, req) {
        assert.ifError(err)
        assert.ok(startsWith(req.file.path, env.uploadDir))
        assert.strictEqual(util.fileSize(req.file.path), 1778)
        done()
      })
    })
  })

  it('should rename the uploaded file', function (done) {
    makeStandardEnv(function (err, env) {
      if (err) return done(err)

      var parser = env.upload.single('small0')
      env.form.append('small0', util.file('small0.dat'))

      util.submitForm(parser, env.form, function (err, req) {
        assert.ifError(err)
        assert.strictEqual(req.file.filename, 'small0small0.dat')
        done()
      })
    })
  })

  it('should ensure all req.files values (single-file per field) point to an array', function (done) {
    makeStandardEnv(function (err, env) {
      if (err) return done(err)

      var parser = env.upload.single('tiny0')
      env.form.append('tiny0', util.file('tiny0.dat'))

      util.submitForm(parser, env.form, function (err, req) {
        assert.ifError(err)
        assert.strictEqual(req.file.filename, 'tiny0tiny0.dat')
        done()
      })
    })
  })

  it('should ensure all req.files values (multi-files per field) point to an array', function (done) {
    makeStandardEnv(function (err, env) {
      if (err) return done(err)

      var parser = env.upload.array('themFiles', 2)
      env.form.append('themFiles', util.file('small0.dat'))
      env.form.append('themFiles', util.file('small1.dat'))

      util.submitForm(parser, env.form, function (err, req) {
        assert.ifError(err)
        assert.strictEqual(req.files.length, 2)
        assert.strictEqual(req.files[0].filename, 'themFilessmall0.dat')
        assert.strictEqual(req.files[1].filename, 'themFilessmall1.dat')
        done()
      })
    })
  })

  it('should rename the destination directory to a different directory', function (done) {
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        temp.template('testforme-%s').mkdir(function (err, uploadDir) {
          if (err) return cb(err)

          cleanup.push(uploadDir)
          cb(null, uploadDir)
        })
      },
      filename: generateFilename
    })

    var form = new FormData()
    var upload = multer({ storage: storage })
    var parser = upload.array('themFiles', 2)

    form.append('themFiles', util.file('small0.dat'))
    form.append('themFiles', util.file('small1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)
      assert.strictEqual(req.files.length, 2)
      assert.ok(req.files[0].path.indexOf('/testforme-') >= 0)
      assert.ok(req.files[1].path.indexOf('/testforme-') >= 0)
      done()
    })
  })
})
