/* eslint-env mocha */

var assert = require('assert')
var stream = require('stream')

var multer = require('../')
var temp = require('fs-temp')
var rimraf = require('rimraf')

describe('defParamCharset', function () {
  var uploadDir, upload

  beforeEach(function (done) {
    temp.mkdir(function (err, path) {
      if (err) return done(err)

      var storage = multer.diskStorage({
        destination: path,
        filename: function (req, file, cb) {
          cb(null, file.originalname)
        }
      })

      uploadDir = path
      upload = multer({ storage: storage })
      done()
    })
  })

  afterEach(function (done) {
    rimraf(uploadDir, done)
  })

  it('should use latin1 as default charset for non-extended parameters', function (done) {
    var req = new stream.PassThrough()
    var boundary = 'AaB03x'

    // Create a filename with latin1 characters (e.g., café encoded as latin1)
    // In latin1: é = 0xE9
    var bodyParts = [
      '--' + boundary,
      'Content-Disposition: form-data; name="testfile"; filename="caf',
      '.txt"',
      'Content-Type: text/plain',
      '',
      'test file content',
      '--' + boundary + '--'
    ]

    // Create buffer with proper latin1 encoding
    var bodyBuffer = Buffer.concat([
      Buffer.from(bodyParts[0] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[1], 'ascii'),
      Buffer.from([0xE9]), // é in latin1
      Buffer.from(bodyParts[2] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[3] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[4] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[5] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[6], 'ascii')
    ])

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': bodyBuffer.length
    }

    req.end(bodyBuffer)

    upload.single('testfile')(req, null, function (err) {
      assert.ifError(err)

      // With latin1 (default), the filename should be interpreted as latin1
      assert.strictEqual(req.file.originalname, 'café.txt')
      assert.strictEqual(req.file.fieldname, 'testfile')

      done()
    })
  })

  it('should use custom charset when defParamCharset is specified', function (done) {
    var customUpload = multer({
      storage: multer.diskStorage({
        destination: uploadDir,
        filename: function (req, file, cb) {
          cb(null, file.originalname)
        }
      }),
      defParamCharset: 'utf8'
    })

    var req = new stream.PassThrough()
    var boundary = 'AaB03x'

    // Create a filename with UTF-8 characters (e.g., café encoded as UTF-8)
    // In UTF-8: é = 0xC3 0xA9
    var bodyParts = [
      '--' + boundary,
      'Content-Disposition: form-data; name="testfile"; filename="caf',
      '.txt"',
      'Content-Type: text/plain',
      '',
      'test file content',
      '--' + boundary + '--'
    ]

    // Create buffer with proper UTF-8 encoding
    var bodyBuffer = Buffer.concat([
      Buffer.from(bodyParts[0] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[1], 'ascii'),
      Buffer.from([0xC3, 0xA9]), // é in UTF-8
      Buffer.from(bodyParts[2] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[3] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[4] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[5] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[6], 'ascii')
    ])

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': bodyBuffer.length
    }

    req.end(bodyBuffer)

    customUpload.single('testfile')(req, null, function (err) {
      assert.ifError(err)

      // With utf8, the filename should be interpreted as utf8
      assert.strictEqual(req.file.originalname, 'café.txt')
      assert.strictEqual(req.file.fieldname, 'testfile')

      done()
    })
  })

  it('should not affect extended parameters with explicit charset', function (done) {
    var customUpload = multer({
      storage: multer.diskStorage({
        destination: uploadDir,
        filename: function (req, file, cb) {
          cb(null, file.originalname)
        }
      }),
      defParamCharset: 'ascii' // This should be ignored for extended parameters
    })

    var req = new stream.PassThrough()
    var boundary = 'AaB03x'

    var body = [
      '--' + boundary,
      // Extended parameter with explicit UTF-8 charset should override defParamCharset
      'Content-Disposition: form-data; name="testfile"; filename*=utf-8\'\'caf%C3%A9.txt',
      'Content-Type: text/plain',
      '',
      'test file content',
      '--' + boundary + '--'
    ].join('\r\n')

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': body.length
    }

    req.end(body)

    customUpload.single('testfile')(req, null, function (err) {
      assert.ifError(err)

      // Extended parameter should use its own charset (UTF-8), not defParamCharset
      assert.strictEqual(req.file.originalname, 'café.txt')
      assert.strictEqual(req.file.fieldname, 'testfile')

      done()
    })
  })

  it('should handle different charsets correctly', function (done) {
    var customUpload = multer({
      storage: multer.diskStorage({
        destination: uploadDir,
        filename: function (req, file, cb) {
          cb(null, file.originalname)
        }
      }),
      defParamCharset: 'iso-8859-1' // Same as latin1
    })

    var req = new stream.PassThrough()
    var boundary = 'AaB03x'

    // Test with ISO-8859-1 encoded characters
    var bodyParts = [
      '--' + boundary,
      'Content-Disposition: form-data; name="testfile"; filename="test',
      '.txt"',
      'Content-Type: text/plain',
      '',
      'test file content',
      '--' + boundary + '--'
    ]

    // Create buffer with proper ISO-8859-1 encoding
    var bodyBuffer = Buffer.concat([
      Buffer.from(bodyParts[0] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[1], 'ascii'),
      Buffer.from([0xF1]), // ñ in ISO-8859-1
      Buffer.from(bodyParts[2] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[3] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[4] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[5] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[6], 'ascii')
    ])

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': bodyBuffer.length
    }

    req.end(bodyBuffer)

    customUpload.single('testfile')(req, null, function (err) {
      assert.ifError(err)

      // Should correctly decode the ñ character
      assert.strictEqual(req.file.originalname, 'testñ.txt')
      assert.strictEqual(req.file.fieldname, 'testfile')

      done()
    })
  })

  it('should work with memory storage', function (done) {
    var memoryUpload = multer({
      storage: multer.memoryStorage(),
      defParamCharset: 'utf8'
    })

    var req = new stream.PassThrough()
    var boundary = 'AaB03x'

    var bodyParts = [
      '--' + boundary,
      'Content-Disposition: form-data; name="testfile"; filename="test',
      '.txt"',
      'Content-Type: text/plain',
      '',
      'test file content',
      '--' + boundary + '--'
    ]

    // Create buffer with proper UTF-8 encoding
    var bodyBuffer = Buffer.concat([
      Buffer.from(bodyParts[0] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[1], 'ascii'),
      Buffer.from([0xC3, 0xA9]), // é in UTF-8
      Buffer.from(bodyParts[2] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[3] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[4] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[5] + '\r\n', 'ascii'),
      Buffer.from(bodyParts[6], 'ascii')
    ])

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': bodyBuffer.length
    }

    req.end(bodyBuffer)

    memoryUpload.single('testfile')(req, null, function (err) {
      assert.ifError(err)

      assert.strictEqual(req.file.originalname, 'testé.txt')
      assert.strictEqual(req.file.fieldname, 'testfile')
      assert.ok(Buffer.isBuffer(req.file.buffer))

      done()
    })
  })

  it('should work with array uploads', function (done) {
    var customUpload = multer({
      storage: multer.diskStorage({
        destination: uploadDir,
        filename: function (req, file, cb) {
          cb(null, file.originalname)
        }
      }),
      defParamCharset: 'utf8'
    })

    var req = new stream.PassThrough()
    var boundary = 'AaB03x'

    // Create buffer with proper UTF-8 encoding for both files
    var bodyBuffer = Buffer.concat([
      Buffer.from('--' + boundary + '\r\n', 'ascii'),
      Buffer.from('Content-Disposition: form-data; name="testfiles"; filename="file1', 'ascii'),
      Buffer.from([0xC3, 0xA9]), // é in UTF-8
      Buffer.from('.txt"\r\n', 'ascii'),
      Buffer.from('Content-Type: text/plain\r\n', 'ascii'),
      Buffer.from('\r\n', 'ascii'),
      Buffer.from('test file 1 content\r\n', 'ascii'),
      Buffer.from('--' + boundary + '\r\n', 'ascii'),
      Buffer.from('Content-Disposition: form-data; name="testfiles"; filename="file2', 'ascii'),
      Buffer.from([0xC3, 0xB1]), // ñ in UTF-8
      Buffer.from('.txt"\r\n', 'ascii'),
      Buffer.from('Content-Type: text/plain\r\n', 'ascii'),
      Buffer.from('\r\n', 'ascii'),
      Buffer.from('test file 2 content\r\n', 'ascii'),
      Buffer.from('--' + boundary + '--', 'ascii')
    ])

    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + boundary,
      'content-length': bodyBuffer.length
    }

    req.end(bodyBuffer)

    customUpload.array('testfiles', 2)(req, null, function (err) {
      assert.ifError(err)

      assert.strictEqual(req.files.length, 2)
      assert.strictEqual(req.files[0].originalname, 'file1é.txt')
      assert.strictEqual(req.files[1].originalname, 'file2ñ.txt')

      done()
    })
  })
})
