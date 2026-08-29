# Multer Storage Engine

Storage engines are classes that expose two functions: `_handleFile` and `_removeFile`.
Follow the template below to get started with your own custom storage engine.

When asking the user for input (such as where to save this file), always give
them the parameters `req, file, cb`, in this order. This makes it easier for
developers to switch between storage engines.

For example, in the template below, the engine saves the files to the disk. The
user tells the engine where to save the file, and this is done by
providing the `destination` parameter:

```javascript
var storage = myCustomStorage({
  destination: function (req, file, cb) {
    cb(null, '/var/www/uploads/' + file.originalname)
  }
})
```

Your engine is responsible for storing the file and returning information on how to
access the file in the future. This is done by the `_handleFile` function.

The file data will be given to you as a stream (`file.stream`). You should pipe
this data somewhere, and when you are done, call `cb` with some information on the
file.

A few rules about `file.stream`:

- Always consume it. If you decide not to store the rest of a file, call
  `file.stream.resume()` to discard it and then call `cb`; parsing continues
  with the next part. Do not call `file.stream.destroy()`: busboy cannot
  continue after a destroyed part stream and the request would hang.
- When the request is aborted or fails, `file.stream` emits `error` and `close`.
  Use `stream.pipeline(file.stream, yourStream, cb)` rather than `pipe()`, so
  your output stream is destroyed and `cb` is called with the error in that
  case. Multer then calls `_removeFile` for the files that were already stored,
  and for files still being written if `file.path` (or whatever `_removeFile`
  needs) has been set on the file object, so set it before you start writing.

The information you provide in the callback will be merged with multer's file object,
and then presented to the user via `req.files`.

Your engine is also responsible for removing files if an error is encountered
later on. Multer will decide which files to delete and when. Your storage class must
implement the `_removeFile` function. It will receive the same arguments as
`_handleFile`. Invoke the callback once the file has been removed.

## Template

```javascript
var fs = require('fs')
var pipeline = require('stream').pipeline

function getDestination (req, file, cb) {
  cb(null, '/dev/null')
}

function MyCustomStorage (opts) {
  this.getDestination = (opts.destination || getDestination)
}

MyCustomStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  this.getDestination(req, file, function (err, path) {
    if (err) return cb(err)

    var outStream = fs.createWriteStream(path)

    // Lets multer remove a partially written file if the request fails
    file.path = path

    pipeline(file.stream, outStream, function (err) {
      if (err) return cb(err)

      cb(null, {
        path: path,
        size: outStream.bytesWritten
      })
    })
  })
}

MyCustomStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  fs.unlink(file.path, cb)
}

module.exports = function (opts) {
  return new MyCustomStorage(opts)
}
```
