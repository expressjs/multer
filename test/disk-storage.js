/* eslint-env mocha */

var assert = require('assert')
var deepEqual = require('deep-equal')

var fs = require('fs')
var path = require('path')
var util = require('./_util')
var multer = require('../')
var temp = require('fs-temp')
var rimraf = require('rimraf')
var FormData = require('form-data')

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

  it('should process parser/form-data POST request', function (done) {
    var form = new FormData()
    var parser = upload.single('small0')

    form.append('name', 'Multer')
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.strictEqual(req.body.name, 'Multer')

      assert.strictEqual(req.file.fieldname, 'small0')
      assert.strictEqual(req.file.originalname, 'small0.dat')
      assert.strictEqual(req.file.size, 1778)
      assert.strictEqual(util.fileSize(req.file.path), 1778)

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

      assert(deepEqual(req.body.checkboxfull, ['cb1', 'cb2']))
      assert(deepEqual(req.body.checkboxhalfempty, ['cb1', '']))
      assert(deepEqual(req.body.checkboxempty, ['', '']))

      assert.strictEqual(req.file.fieldname, 'empty')
      assert.strictEqual(req.file.originalname, 'empty.dat')
      assert.strictEqual(req.file.size, 0)
      assert.strictEqual(util.fileSize(req.file.path), 0)

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

      assert(deepEqual(req.body, {}))

      assert.strictEqual(req.files.empty[0].fieldname, 'empty')
      assert.strictEqual(req.files.empty[0].originalname, 'empty.dat')
      assert.strictEqual(req.files.empty[0].size, 0)
      assert.strictEqual(util.fileSize(req.files.empty[0].path), 0)

      assert.strictEqual(req.files.tiny0[0].fieldname, 'tiny0')
      assert.strictEqual(req.files.tiny0[0].originalname, 'tiny0.dat')
      assert.strictEqual(req.files.tiny0[0].size, 122)
      assert.strictEqual(util.fileSize(req.files.tiny0[0].path), 122)

      assert.strictEqual(req.files.tiny1[0].fieldname, 'tiny1')
      assert.strictEqual(req.files.tiny1[0].originalname, 'tiny1.dat')
      assert.strictEqual(req.files.tiny1[0].size, 7)
      assert.strictEqual(util.fileSize(req.files.tiny1[0].path), 7)

      assert.strictEqual(req.files.small0[0].fieldname, 'small0')
      assert.strictEqual(req.files.small0[0].originalname, 'small0.dat')
      assert.strictEqual(req.files.small0[0].size, 1778)
      assert.strictEqual(util.fileSize(req.files.small0[0].path), 1778)

      assert.strictEqual(req.files.small1[0].fieldname, 'small1')
      assert.strictEqual(req.files.small1[0].originalname, 'small1.dat')
      assert.strictEqual(req.files.small1[0].size, 315)
      assert.strictEqual(util.fileSize(req.files.small1[0].path), 315)

      assert.strictEqual(req.files.medium[0].fieldname, 'medium')
      assert.strictEqual(req.files.medium[0].originalname, 'medium.dat')
      assert.strictEqual(req.files.medium[0].size, 13196)
      assert.strictEqual(util.fileSize(req.files.medium[0].path), 13196)

      assert.strictEqual(req.files.large[0].fieldname, 'large')
      assert.strictEqual(req.files.large[0].originalname, 'large.jpg')
      assert.strictEqual(req.files.large[0].size, 2413677)
      assert.strictEqual(util.fileSize(req.files.large[0].path), 2413677)

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
      assert(deepEqual(err.storageErrors, []))

      var files = fs.readdirSync(uploadDir)
      assert(deepEqual(files, []))

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
})
