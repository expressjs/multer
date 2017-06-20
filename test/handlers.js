/* eslint-env mocha */
'use strict'

var assert = require('assert')
var FormData = require('form-data')
var fs = require('fs-temp')

var multer = require('../')
var util = require('./_util')

var Writable = require('stream').Writable

class TestWritable extends Writable {
  constructor (options) {
    super(options)
    this.on('finish', function () {
      this.emit('unicorn', 'arg')
      this.emit('rainbow', 'arg')
    })
  }

  _write (chunk, encoding, callback) {
    callback()
  }
}

describe('Handlers', function () {
  var parser

  it('should accept a handler configuration', function () {
    assert.doesNotThrow(function () {
      multer({handler: function () {}})
    })
  })

  it('should accept a handler that returns a stream', function () {
    var form = new FormData()

    function handler () {
      return fs.createWriteStream()
    }

    parser = multer({handler: handler}).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.file)
      assert.equal(req.file.fieldName, 'file')
      assert.equal(req.file.originalName, 'small.dat')
      assert.equal(req.file.size, null)
      assert.equal(req.file.stream, null)
      assert.equal(req.file.path, null)
    })
  })

  it('should accept a handler that returns a object', function () {
    var form = new FormData()

    function handler () {
      return {
        stream: fs.createWriteStream()
      }
    }

    parser = multer({handler: handler}).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.file)
      assert.equal(req.file.fieldName, 'file')
      assert.equal(req.file.originalName, 'small.dat')
      assert.equal(req.file.size, null)
      assert.equal(req.file.stream, null)
      assert.equal(req.file.path, null)
    })
  })

  it('should accept a handler that returns a promise', function () {
    var form = new FormData()

    function handler () {
      return new Promise(function (resolve) {
        resolve(fs.createWriteStream())
      })
    }

    parser = multer({handler: handler}).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.file)
      assert.equal(req.file.fieldName, 'file')
      assert.equal(req.file.originalName, 'small.dat')
      assert.equal(req.file.size, null)
      assert.equal(req.file.stream, null)
      assert.equal(req.file.path, null)
    })
  })

  it('should accept a handler that resolves to an object', function () {
    var form = new FormData()

    function handler () {
      return new Promise(function (resolve) {
        resolve({stream: fs.createWriteStream()})
      })
    }

    parser = multer({handler: handler}).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.file)
      assert.equal(req.file.fieldName, 'file')
      assert.equal(req.file.originalName, 'small.dat')
      assert.equal(req.file.size, null)
      assert.equal(req.file.stream, null)
      assert.equal(req.file.path, null)
    })
  })

  it('should accept a handler that has a post processing function', function () {
    var form = new FormData()

    function handler (req, file) {
      return {
        stream: fs.createWriteStream(),
        finish: function () {
          file.metadata = 'random data'
        }
      }
    }

    parser = multer({handler: handler}).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.file)
      assert.equal(req.file.fieldName, 'file')
      assert.equal(req.file.originalName, 'small.dat')
      assert.equal(req.file.size, null)
      assert.equal(req.file.stream, null)
      assert.equal(req.file.path, null)
      assert.equal(req.file.metadata, 'random data')
    })
  })

  it('should accept a handler that changes the stream event', function () {
    var form = new FormData()
    var stream

    function handler () {
      stream = new TestWritable()
      return {
        stream: stream,
        event: 'unicorn'
      }
    }

    parser = multer({handler: handler}).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.file)
      assert.equal(stream.listenerCount('unicorn'), 1)
      assert.equal(req.file.fieldName, 'file')
      assert.equal(req.file.originalName, 'small.dat')
    })
  })

  it('should receive the arguments after the event is emitted', function () {
    var form = new FormData()
    var stream = new TestWritable()
    var args

    function handler () {
      return {
        stream: stream,
        event: 'unicorn',
        finish: function () {
          args = arguments
        }
      }
    }

    parser = multer({handler: handler}).single('file')

    form.append('name', 'Multer')
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.file)
      assert.equal(stream.listenerCount('unicorn'), 1)
      assert.equal(req.file.fieldName, 'file')
      assert.equal(req.file.originalName, 'small.dat')
      assert.equal(args.length, 1)
      assert.equal(args[0], 'arg')
    })
  })

  it('should answer to different events per file', function () {
    var form = new FormData()
    var events = ['unicorn', 'rainbow']
    var counter = 0

    function handler (req, file) {
      var stream = new TestWritable()
      var evt = events[counter]
      counter++
      return {
        stream: stream,
        event: evt,
        finish: function () {
          file.stream = stream
        }
      }
    }

    parser = multer({handler: handler}).array('file', 2)

    form.append('name', 'Multer')
    form.append('file', util.file('small'))
    form.append('file', util.file('small'))

    return util.submitForm(parser, form).then(function (req) {
      assert.equal(req.body.name, 'Multer')

      assert.ok(req.files)

      req.files.forEach(function (file, index) {
        assert.equal(file.stream.listenerCount(events[index]), 1)
        assert.equal(file.fieldName, 'file')
        assert.equal(file.originalName, 'small.dat')
      })
    })
  })
})
