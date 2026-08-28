/* eslint-env mocha */

var assert = require('assert')
var FormData = require('form-data')

var multer = require('../')
var util = require('./_util')

/**
 * 构建一个自定义 storage engine，捕获 _handleFile 与 _removeFile 的调用。
 *
 * 对应 issue #1293 的疑问：_handleFile 的 cb(null, info) 会被合并到
 * 同一个 file 对象（见 lib/make-middleware.js 中 fileInfo = { ...file, ...info }），
 * _removeFile 应该能拿到这些字段；本组测试对此做断言。
 */
function makeStorage () {
  var captured = {
    handleCalls: [],
    removeCalls: []
  }

  var storage = {
    _handleFile: function (req, file, cb) {
      captured.handleCalls.push(file.originalname)
      // 消费来源流，模拟真实引擎：流读取完成后才回调（超限截断的流不会触发 end）
      file.stream.on('data', function () {})
      file.stream.on('end', function () {
        // 在 info 中返回自定义的 path
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

    // tiny1.dat 为 7 字节，先被正常保存
    form.append('files', util.file('tiny1.dat'))
    // tiny0.dat 为 128 字节，超限触发清理
    form.append('files', util.file('tiny0.dat'))

    util.submitForm(upload.array('files', 2), form, function (err) {
      assert.strictEqual(err.code, 'LIMIT_FILE_SIZE')

      // 两个文件都进入了 uploadedFiles：tiny1.dat 正常保存，tiny0.dat 超限
      // 但其 _handleFile 已完成（aborting 分支仍将其计入），因此都会被清理
      assert.strictEqual(engine.captured.handleCalls.length, 2)
      assert.strictEqual(engine.captured.removeCalls.length, 2)

      // _handleFile 返回的 info 应已合并到传给 _removeFile 的 file 对象上
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

      // small0.dat 已保存，应被清理；tiny1.dat 在 fileFilter 阶段被拒，未保存
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

      // 与自定义 storage 一致：已进入 uploadedFiles 的两个文件都会被清理，
      // memory storage 的 _removeFile 删除各自 file.buffer
      assert.strictEqual(removeCalls, 2)
      done()
    })
  })
})
