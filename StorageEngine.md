# Multer Storage Engine

Storage engine are classes that exposes at least one function: `handleFile`.
Follow the template below to get started with your storage engine.

When asking the user for input (such as where to save this file), always give
them the parameters `req, file, cb`, in this order. This makes it easier for
developers to switch between storage engines.

For example, in the template below the engine saves the files to the disk. The
user needs to tell the engine where to save the file, and this is done by
providing the `destination` parameter. It is used as such:

```javascript
var storage = myCustomStorage({
  destination: function (req, file, cb) {
    cb(null, '/var/www/uploads/' + file.originalname)
  }
})
```

Your engine is responsible for storing the file and provide back info on how to
access the file in the future. This is done by the `handleFile` function.

The file data will be given to you as a stream (`file.stream`). You should pipe
this data somewhere, and when you are done, call `cb` with some info on the
file.

The info you provide in the callback will be merged in with the other file info,
and then presented to the user via `req.files`.

## Template

```javascript
var fs = require('fs')

function getDestination (req, file, cb) {
  cb(null, '/dev/null')
}

function MyCustomStorage (opts) {
  opts.getDestination = (opts.destination || getDestination)
}

MyCustomStorage.prototype.handleFile = function handleFile (req, file, cb) {
  this.getDestination(req, file, function (err, path) {
    if (err) return cb(err)

    var outStream = fs.createWriteStream(path)

    file.stream.pipe(outStream)
    outStream.on('error', cb)
    outStream.on('finish', function () {
      cb(null, {
        path: path,
        size: outStream.bytesWritten
      })
    })
  })
}

module.exports = function (opts) {
  return new MyCustomStorage(opts)
}
```
