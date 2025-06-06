var fs = require('fs')
var path = require('path')
var stream = require('stream')

exports.filePath = function filePath (name) {
  return path.join(__dirname, 'files', name)
}

exports.file = function file (name) {
  return fs.createReadStream(this.filePath(name))
}

exports.fileSize = function fileSize (path) {
  return fs.statSync(path).size
}

exports.fileSizeByName = function fileSizeByName (name) {
  return this.fileSize(this.filePath(name))
}

exports.readDir = function readDir (dirPath) {
  return fs.readdirSync(dirPath)
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
