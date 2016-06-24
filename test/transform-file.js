/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')
var through2 = require('through2')

describe('Transform File', function () {
  it('transfrom the file contents', function (done) {
    var form = new FormData()
    var upload = multer({
      storage: multer.memoryStorage(),
      transformFile: function (req, file, cb) {
        // Transforms the stream by changing the first < to >
        var origStream = file.stream
        file.stream = through2(function (buf, enc, done) {
          done(null, new Buffer(buf.toString().replace('<', '>')))
        })
        origStream.pipe(file.stream)
        cb(null, file)
      }
	})
    var parser = upload.single('tiny1')
    form.append('tiny1', util.file('tiny1.dat'))
    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.file.fieldname, 'tiny1')
      assert.equal(req.file.originalname, 'tiny1.dat')
      assert.equal(req.file.size, 7)
      assert.equal(req.file.buffer.length, 7)
      assert.equal(req.file.buffer.toString(), '>o)))<<')

      done()
    })
  })

  it('transfrom the file properties', function (done) {
    var form = new FormData()
    var upload = multer({
      storage: multer.memoryStorage(),
      transformFile: function (req, file, cb) {
        file.originalname = 'tiny1.txt'
        cb(null, file)
      }
	})
    var parser = upload.single('tiny1')
    form.append('tiny1', util.file('tiny1.dat'))
    util.submitForm(parser, form, function (err, req) {
      assert.ifError(err)

      assert.equal(req.file.fieldname, 'tiny1')
      assert.equal(req.file.originalname, 'tiny1.txt')
      assert.equal(req.file.size, 7)
      assert.equal(req.file.buffer.length, 7)
      assert.equal(req.file.buffer.toString(), '<o)))<<')

      done()
    })
  })
})
