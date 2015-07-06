/* eslint-env mocha */

var assert = require('assert')

var util = require('./_util')
var multer = require('../')
var FormData = require('form-data')

function withLimits (limits, fields) {
  var storage = multer.memoryStorage()
  return multer({ storage: storage, limits: limits }).fields(fields)
}

describe('Error Handling', function () {
  it('should respect parts limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ parts: 1 }, [
      { name: 'small0', maxCount: 1 }
    ])

    form.append('field0', 'BOOM!')
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_PART_COUNT')
      done()
    })
  })

  it('should respect file size limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fileSize: 1500 }, [
      { name: 'tiny0', maxCount: 1 },
      { name: 'small0', maxCount: 1 }
    ])

    form.append('tiny0', util.file('tiny0.dat'))
    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FILE_SIZE')
      assert.equal(err.field, 'small0')
      done()
    })
  })

  it('should respect file count limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ files: 1 }, [
      { name: 'small0', maxCount: 1 },
      { name: 'small1', maxCount: 1 }
    ])

    form.append('small0', util.file('small0.dat'))
    form.append('small1', util.file('small1.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FILE_COUNT')
      done()
    })
  })

  it('should respect file key limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fieldNameSize: 4 }, [
      { name: 'small0', maxCount: 1 }
    ])

    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FIELD_KEY')
      done()
    })
  })

  it('should respect field key limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fieldNameSize: 4 }, [])

    form.append('ok', 'SMILE')
    form.append('blowup', 'BOOM!')

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FIELD_KEY')
      done()
    })
  })

  it('should respect field value limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fieldSize: 16 }, [])

    form.append('field0', 'This is okay')
    form.append('field1', 'This will make the parser explode')

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FIELD_VALUE')
      assert.equal(err.field, 'field1')
      done()
    })
  })

  it('should respect field count limit', function (done) {
    var form = new FormData()
    var parser = withLimits({ fields: 1 }, [])

    form.append('field0', 'BOOM!')
    form.append('field1', 'BOOM!')

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_FIELD_COUNT')
      done()
    })
  })

  it('should respect fields given', function (done) {
    var form = new FormData()
    var parser = withLimits(undefined, [
      { name: 'wrongname', maxCount: 1 }
    ])

    form.append('small0', util.file('small0.dat'))

    util.submitForm(parser, form, function (err, req) {
      assert.equal(err.code, 'LIMIT_UNEXPECTED_FILE')
      assert.equal(err.field, 'small0')
      done()
    })
  })
})
