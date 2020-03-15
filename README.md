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
const multer = require('multer')
const express = require('express')

const app = express()
const upload = multer()

app.post('/profile', upload.single('avatar'), (req, res, next) => {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
})

app.post('/photos/upload', upload.array('photos', 12), (req, res, next) => {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, (req, res, next) => {
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
const multer = require('multer')
const express = require('express')

const app = express()
const upload = multer()

app.post('/profile', upload.none(), (req, res, next) => {
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
`size` | Size of the file in bytes
`stream` | Stream of file
`detectedMimeType` | The detected mime-type, or null if we failed to detect
`detectedFileExtension` | The typical file extension for files of the detected type, or empty string if we failed to detect (with leading `.` to match `path.extname`)
`clientReportedMimeType` | The mime type reported by the client using the `Content-Type` header, or null<sup>1</sup> if the header was absent
`clientReportedFileExtension` | The extension of the file uploaded (as reported by `path.extname`)

<sup>1</sup> Currently returns `text/plain` if header is absent, this is a bug and it will be fixed in a patch release. Do not rely on this behavior.

### `multer(opts)`

Multer accepts an options object, the following are the options that can be
passed to Multer.

Key      | Description
-------- | -----------
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

The following limits are available:

Key | Description | Default
--- | --- | ---
`fieldNameSize` | Max field name size | `'100B'`
`fieldSize` | Max field value size | `'8KB'`
`fields` | Max number of non-file fields | `1000`
`fileSize` | The max file size | `'8MB'`
`files` | The max number of file fields | `10`
`headerPairs` | The max number of header key=>value pairs to parse | `2000` (same as Node's http)

Bytes limits can be passed either as a number, or as a string with an appropriate prefix.

Specifying the limits can help protect your site against denial of service (DoS) attacks.

## Error handling

When encountering an error, multer will delegate the error to express. You can
display a nice error page using [the standard express way](http://expressjs.com/guide/error-handling.html).

If you want to catch errors specifically from multer, you can call the
middleware function by yourself.

```javascript
const upload = multer().single('avatar')

app.post('/profile', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      // An error occurred when uploading
      return
    }

    // Everything went fine
  })
})
```
