var fs = require('fs')
var path = require('path')
var stream = require('stream')

exports.file = function file (name) {
  return fs.createReadStream(path.join(__dirname, 'files', name))
}

exports.fileSize = function fileSize (path) {
  return fs.statSync(path).size
}

exports.submitForm = function submitForm (multer, form, cb) {
  form.getLength(function (err, length) {
    if (err) return cb(err)

    var req = new stream.PassThrough()

    form.pipe(req)
    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      'content-length': length
    }

    multer(req, null, function (err) {
      cb(err, req)
    })
  })
}

exports.toNullProtoDeep = function toNullProtoDeep (value) {
  if (Array.isArray(value)) {
    return value.map(function (item) { return toNullProtoDeep(item) })
  }

  if (value && typeof value === 'object') {
    var out = Object.create(null)

    Object.keys(value).forEach(function (key) {
      out[key] = toNullProtoDeep(value[key])
    })

    return out
  }

  return value
}
