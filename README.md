# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer is a node.js middleware for handling `multipart/form-data`. It is written
on top of [busboy](https://github.com/mscdex/busboy) for maximum efficiency.

## Installation

```sh
npm install --save multer
```

## Usage

```javascript
var express = require('express')
var multer  = require('multer')

var app = express()
app.use(multer({ dest: 'uploads/' }))
```

You can access the fields and files in the `request` object:

```javascript
console.log(req.body)
console.log(req.files)
```

**IMPORTANT**: Multer will not process any form which is not `multipart/form-data`.

## API

### `req.files`

req.files is a object where the key is the fieldname, and the value is
information about the file.

Each file has the following properties:

Key | Description | Note
--- | --- | ---
`fieldname` | Field name specified in the form |
`originalname` | Name of the file on the user's computer |
`encoding` | Encoding type of the file |
`mimetype` | Mime type of the file |
`size` | Size of the file in bytes |
`destination` | The folder to which the file has been saved | `DiskStorage`
`filename` | The name of the file within the `destination` | `DiskStorage`
`path` | The full path to the uploaded file | `DiskStorage`
`buffer` | A `Buffer` of the entire file | `MemoryStorage`

### `multer(opts)`

Multer accepts an options object, the most basic of which is the `dest`
property, which tells Multer where to upload the files. In case you omit the
options object, the file will be renamed and uploaded to the temporary directory
of the system.

By the default, Multer will rename the files so as to avoid name conflicts. The
renaming function can be customized according to your needs.

The following are the options that can be passed to Multer.

Key | Description
--- | ---
`dest` or `storage` | Where to store the files
`fileFilter` | Function to control which files are accepted
`limits` | Limits of the uploaded data

Apart from these, Multer also supports more advanced [busboy options](https://github.com/mscdex/busboy#busboy-methods) like `highWaterMark`, `fileHwm`, and `defCharset`.

In an average web app, only `dest` might be required, and configured as shown in
the following example.

```javascript
app.use(multer({ dest: 'uploads/' }))
```

If you want more control over your uploads, you'll want to use the `storage`
option instead of `dest`. Multer ships with to storage engines `DiskStorage`
and `MemoryStorage`, more engines is available from third parties.

#### `DiskStorage`

The disk storage engine gives you full control on storing files to disk.

```javascript
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

app.use(multer({ storage: storage }))
```

There are two options available, `destination` and `filename`. They are both
functions that helps to determine where the file should be stored.

`destination` is used to determine within which folder the uploaded files should
be stored. This can also be given as a `string` (e.g. `'/tmp/uploads'`).

`filename` is used to determine what the file should be named inside the folder.

Both function gets passed both the request (`req`) and some information about
the file (`file`) to aid with the decision.

Note that `req.body` might not have been fully populated yet. It depends on the
order that the client sends the fields and files.

#### `MemoryStorage`

The memory storage engine stores the files in memory as `Buffer` objects. It
dosen't have any options.

```javascript
var storage = multer.memoryStorage()

app.use(multer({ storage: storage }))
```

When using the memory storage, the file info will contain a field called
`buffer` that contains the entire file.

**WARNING**: Uploading very large files, or relatively small files in large
numbers very quickly, can cause your application to run out of memory when the
memory storage is used.

### `limits`

An object specifying the size limits of the following optional properties. This object is passed to busboy directly, and the details of properties can be found on [busboy's page](https://github.com/mscdex/busboy#busboy-methods)

The following integer values is available:

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

### `fileFilter`

Set this to a function to control which files should be uploaded and which
should be skipped. The function should look like this:

```javascript
function fileFilter (req, file, cb) {

  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted

  // To reject this file pass `false`, like so:
  cb(null, false)

  // To accept the file pass `true`, like so:
  cb(null, true)

  // You can always pass an error if something goes wrong:
  cb(new Error('I don\'t have a clue!'))

}
```

## License

[MIT](LICENSE)
