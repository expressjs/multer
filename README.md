# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer is a node.js middleware for handling `multipart/form-data`, which is primarily used for uploading files. It is written
on top of [busboy](https://github.com/mscdex/busboy) for maximum efficiency.

**NOTE**: Multer will not process any form which is not multipart (`multipart/form-data`).

## Installation

```sh
npm install --save multer
```

## Usage

Multer adds a `body` object and a `file` or `files` object to the `request` object. The `body` object contains the values of the text fields of the form, the `file` or `files` object contains the files uploaded via the form.

Basic usage example:

```javascript
var multer = require('multer')
var express = require('express')

var app = express()
var upload = multer()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
})

var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
})
```

In case you need to handle a text-only multipart form, you can use the `.none()` method, example:

```javascript
var multer = require('multer')
var express = require('express')

var app = express()
var upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body contains the text fields
})
```

## API

### File information

Each file contains the following information:

Key | Description
--- | ---
`fieldName` | Field name specified in the form
`originalName` | Name of the file on the user's computer (`undefined` if no filename was supplied by the client)
`size` | Size of the file in bytes <sup>2</sup>
`stream` | A new readable stream for the stored file <sup>2</sup>
`path` | The full path where the file is stored <sup>2</sup>
`detectedMimeType` | The detected mime-type, or null if we failed to detect
`detectedFileExtension` | The typical file extension for files of the detected type, or empty string if we failed to detect (with leading `.` to match `path.extname`)
`clientReportedMimeType` | The mime type reported by the client using the `Content-Type` header, or null<sup>1</sup> if the header was absent
`clientReportedFileExtension` | The extension of the file uploaded (as reported by `path.extname`)

<sup>1</sup> Currently returns `text/plain` if header is absent, this is a bug and it will be fixed in a patch release. Do not rely on this behavior.

<sup>2</sup> Available only when the `handler` option is not used

### `multer(opts)`

The following are the options that can be passed to Multer. All of them are optional.
The `opts` parameter can also be a string with a path in which case it will  be used
as the destination to store files.


Key      | Description
-------- | -----------
`dest` | The destination path to store files. If no destination is provided the os temporary folder is used.
`handler` | A function that allows you supply your own writable stream for customization of file storage. Using this causes `dest` to be ignored. See [using streams](#using-streams) for more information
`limits` | Limits of the uploaded data [(full description)](#limits)

#### `.single(fieldname)`

Accept a single file with the name `fieldname`. The single file will be stored
in `req.file`.

#### `.array(fieldname[, maxCount])`

Accept an array of files, all with the name `fieldname`. Optionally error out if
more than `maxCount` files are uploaded. The array of files will be stored in
`req.files`.

#### `.fields(fields)`

Accept a mix of files, specified by `fields`. An object with arrays of files
will be stored in `req.files`.

`fields` should be an array of objects with `name` and optionally a `maxCount`.
Example:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Accept only text fields. If any file upload is made, error with code
"LIMIT\_UNEXPECTED\_FILE" will be issued. This is the same as doing `upload.fields([])`.

#### `.any()`

Accepts all files that comes over the wire. An array of files will be stored in
`req.files`.

**WARNING:** Make sure that you always handle the files that a user uploads.
Never add multer as a global middleware since a malicious user could upload
files to a route that you didn't anticipate. Only use this function on routes
where you are handling the uploaded files.

### `limits`

An object specifying the size limits of the following optional properties. Multer passes this object into busboy directly, and the details of the properties can be found on [busboy's page](https://github.com/mscdex/busboy#busboy-methods).

The following integer values are available:

Key | Description | Default
--- | --- | ---
`fieldNameSize` | Max field name size | 100 bytes
`fieldSize` | Max field value size | 1MB
`fields` | Max number of non-file fields | Infinity
`fileSize` | For multipart forms, the max file size (in bytes) | Infinity
`files` | For multipart forms, the max number of file fields | Infinity
`parts` | For multipart forms, the max number of parts (fields + files) | Infinity
`headerPairs` | For multipart forms, the max number of header key=>value pairs to parse | 2000

Specifying the limits can help protect your site against denial of service (DoS) attacks.

### Using streams

Using handlers allows the efficient use of any stream implementation to store files anywhere.
To achieve this, just pass a function to Multer in the `handler` property that will be invoked with `req` and `file`. You
will have to return a new stream or an object specifying  how the writable streams will be created. It is also
possible to return a promise from a handler in case you need some async before creating the stream.

If you provide an object instead of a stream this are the properties you should set. Only the `stream` property is required.

#### stream

A writable stream to pipe for each incoming file. By default core `fs` streams are used.

#### event

The event that finish the writes. Defaults to `'close'`. You can change this to another value
like `'finish'` or any event that your custom stream implements (Not all
writable streams emit the 'close' event so make sure to change accordingly).

#### finish

A post-processing function that executes after the event specified in the previous property is triggered.
This also gives you an opportunity to extend the file object or inspect the consumed stream. If any arguments
were received from the event they will be available as the parameters of the function. Promises are supported
here as well to allow additional processing like hashing a file, etc.

A handler could be as simple as

```javascript
function handler(req, file) {
  return new writableStream()
}
```

or more complex like

```javascript
function handler(req, file) {
  return doSomeAsync().then(() => {
    return {
      stream: createWriteStream(),
      event: 'landed',
      finish: function() {
        return hashFile().then((hash) => {
          file.metadata = { hash };
          file.stream = createReadStream()
        })
      }
    }
  }
}
```

## Error handling

When encountering an error, multer will delegate the error to express. You can
display a nice error page using [the standard express way](http://expressjs.com/guide/error-handling.html).

If you want to catch errors specifically from multer, you can call the
middleware function by yourself.

```javascript
var upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      // An error occurred when uploading
      return
    }

    // Everything went fine
  })
})
```
