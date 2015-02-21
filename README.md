# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer)

Multer is a node.js middleware for handling `multipart/form-data`.

It is written on top of [busboy](https://github.com/mscdex/busboy) for maximum efficiency.

## API

#### Installation

`$ npm install multer`

#### Usage

```js
var express = require('express')
var multer  = require('multer')

var app = express()
app.use(multer({ dest: './uploads/'}))
```

You can access the fields and files in the `request` object:

```js
console.log(req.body)
console.log(req.files)
```

**IMPORTANT**: Multer will not process any form which is not `multipart/form-data`.

## Multer file object

A multer file object is a JSON object with the following properties.

1. `fieldname` - Field name specified in the form
2. `originalname` - Name of the file on the user's computer
3. `name` - Renamed file name
4. `encoding` - Encoding type of the file
5. `mimetype` - Mime type of the file
6. `path` - Location of the uploaded file
7. `extension` - Extension of the file
8. `size` - Size of the file in bytes
9. `truncated` - If the file was truncated due to size limitation
10. `buffer` - Raw data (is null unless the inMemory option is true)

## Options

Multer accepts an options object, the most basic of which is the `dest` property, which tells Multer where to upload the files. In case you omit the options object, the file will be renamed and uploaded to the temporary directory of the system. If the `inMemory` option is true, no data is written to disk but data is kept in a buffer accessible in the file object.

By the default, Multer will rename the files so as to avoid name conflicts. The renaming function can be customized according to your needs.

The following are the options that can be passed to Multer.

* `dest`
* `limits`
* `includeEmptyFields`
* `inMemory`
* `rename(fieldname, filename, req, res)`
* `changeDest(dest, req, res)`
* `onFileUploadStart(file, req, res)`
* `onFileUploadData(file, data, req, res)`
* `onFileUploadComplete(file, req, res)`
* `onParseStart()`
* `onParseEnd(req, next)`
* `onError()`
* `onFileSizeLimit(file)`
* `onFilesLimit()`
* `onFieldsLimit()`
* `onPartsLimit()`

Apart from these, Multer also supports more advanced [busboy options](https://github.com/mscdex/busboy#busboy-methods) like `highWaterMark`, `fileHwm`, and `defCharset`.

In an average web app, only `dest` and `rename` might be required, and configured as shown in the example.

```js
app.use(multer({
  dest: './uploads/',
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
  }
}))
```

The details of the properties of the options object is explained in the following sections.

### dest

The destination directory for the uploaded files.

`dest: './uploads/'`

### limits

An object specifying the size limits of the following optional properties. This object is passed to busboy directly, and the details of properties can be found on [busboy's page](https://github.com/mscdex/busboy#busboy-methods)

* `fieldNameSize` - integer - Max field name size (Default: 100 bytes)
* `fieldSize` - integer - Max field value size (Default: 1MB)
* `fields` - integer - Max number of non-file fields (Default: Infinity)
* `fileSize` - integer - For multipart forms, the max file size (in bytes) (Default: Infinity)
* `files` - integer - For multipart forms, the max number of file fields (Default: Infinity)
* `parts` - integer - For multipart forms, the max number of parts (fields + files) (Default: Infinity)
* `headerPairs` - integer - For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http).

```js
limits: {
  fieldNameSize: 100,
  files: 2,
  fields: 5
}
```

Specifying the limits can help protect your site against denial of service (DoS) attacks.

### includeEmptyFields

A Boolean value to specify whether empty submitted values should be processed and applied to `req.body`; defaults to `false`;

```js
includeEmptyFields: true
```

### putSingleFilesInArray

**NOTE** In the next major version, `putSingleFilesInArray` will go away and all `req.files` key-value pairs will point to an array of file objects. Begin migrating your code to use `putSingleFilesInArray: true`. This will become the default in the next version. An explanation follows.

In the current version `putSingleFilesInArray` is false. Activate it by setting the property to true.

```js
putSingleFilesInArray: true
```

Some applications or libraries, such as Object Modelers, expect `req.files` key-value pairs to always point to arrays. If `putSingleFilesInArray` is true, multer will ensure all values point to an array. 

```js
// the value points to a single file object
req.files['file1'] = [fileObject1]
// the value points to an array of file objects
req.files['file1'] = [fileObject1, fileObject2]
```

Contrast this with Multer's default behavior, where `putSingleFilesInArray` is false. If the value for any key in `req.files` is a single file, then the value will equal a single file object. And if the value points to multiple files, then the value will equal an array of file objects.

```js
// the value points to a single file object
req.files['file1'] = fileObject1
// the value points to an array of file objects
req.files['file1'] = [fileObject1, fileObject2]
```

### inMemory

If this Boolean value is `true`, the `file.buffer` property holds the data in-memory that Multer would have written to disk. The dest option is still populated and the path property contains the proposed path to save the file. Defaults to `false`.

```js
inMemory: true
```

**WARNING**: Uploading very large files, or relatively small files in large numbers very quickly, can cause your application to run out of memory when `inMemory` is set to `true`.

### rename(fieldname, filename, req, res)

Function to rename the uploaded files. Whatever the function returns will become the new name of the uploaded file (extension is not included). The `fieldname` and `filename` of the file will be available in this function, use them if you need to.

```js
rename: function (fieldname, filename, req, res) {
  return fieldname + filename + Date.now()
}
```

Note that [req.body Warnings](#reqbody-warnings) applies to this function.

### changeDest(dest, req, res)

Function to rename the directory in which to place uploaded files. The `dest` parameter is the default value originally assigned or passed into multer. The `req` and `res` parameters are also passed into the function because they may contain information (eg session data) needed to create the path (eg get userid from the session).

```js
changeDest: function(dest, req, res) {
  return dest + '/user1'; 
}
```

You might want to check that the subdirectory has been created. Here is a synchronous way to do it. The [mkdirp](https://www.npmjs.com/package/mkdirp) module can be used to automatically create nested child directories.

```js
changeDest: function(dest, req, res) {
  dest += '/user1';
  if (!fs.existsSync(dest)) fs.mkdirSync(dest);
  return dest;  
}
```

Note that [req.body Warnings](#reqbody-warnings) applies to this function.

### onFileUploadStart(file, req, res)

Event handler triggered when a file starts to be uploaded. A file object, with the following properties, is available to this function: `fieldname`, `originalname`, `name`, `encoding`, `mimetype`, `path`, and `extension`.

```js
onFileUploadStart: function (file, req, res) {
  console.log(file.fieldname + ' is starting ...')
}
```

You can even stop a file from being uploaded - just return `false` from the event handler. The file won't be processed or reach the file system.

```js
onFileUploadStart: function (file, req, res) {
  if (file.originalname == 'virus.exe') return false;
}
```

Note that [req.body Warnings](#reqbody-warnings) applies to this function.

### onFileUploadData(file, data, req, res)

Event handler triggered when a chunk of buffer is received. A buffer object along with a file object is available to the function.

```js
onFileUploadData: function (file, data, req, res) {
  console.log(data.length + ' of ' + file.fieldname + ' arrived')
}
```

Note that [req.body Warnings](#reqbody-warnings) applies to this function.

### onFileUploadComplete(file, req, res)

Event handler trigger when a file is completely uploaded. A file object is available to the function.

```js
onFileUploadComplete: function (file, req, res) {
  console.log(file.fieldname + ' uploaded to  ' + file.path)
}
```

Note that [req.body Warnings](#reqbody-warnings) applies to this function.

### onParseStart()

Event handler triggered when the form parsing starts.

```js
onParseStart: function () {
  console.log('Form parsing started at: ', new Date())
}
```

### onParseEnd(req, next)

Event handler triggered when the form parsing completes. The `request` object and the `next` objects are are passed to the function.

```js
onParseEnd: function (req, next) {
  console.log('Form parsing completed at: ', new Date());

  // usage example: custom body parse
  req.body = require('qs').parse(req.body);

  // call the next middleware
  next();
}
```

**Note**: If you have created a `onParseEnd` event listener, you must manually call the `next()` function, else the request will be left hanging.

### onError()

Event handler for any errors encountering while processing the form. The `error` object and the `next` object is available to the function. If you are handling errors yourself, make sure to terminate the request or call the `next()` function, else the request will be left hanging.

```js
onError: function (error, next) {
  console.log(error)
  next(error)
}
```

### onFileSizeLimit()

Event handler triggered when a file size exceeds the specification in the `limit` object. No more files will be parsed after the limit is reached.

```js
onFileSizeLimit: function (file) {
  console.log('Failed: ', file.originalname)
  fs.unlink('./' + file.path) // delete the partially written file
}
```

### onFilesLimit()

Event handler triggered when the number of files exceed the specification in the `limit` object. No more files will be parsed after the limit is reached.

```js
onFilesLimit: function () {
  console.log('Crossed file limit!')
}
```

### onFieldsLimit()

Event handler triggered when the number of fields exceed the specification in the `limit` object. No more fields will be parsed after the limit is reached.

```js
onFieldsLimit: function () {
  console.log('Crossed fields limit!')
}
```

### onPartsLimit()

Event handler triggered when the number of parts exceed the specification in the `limit` object. No more files or fields will be parsed after the limit is reached.

```js
onPartsLimit: function () {
  console.log('Crossed parts limit!')
}
```

## req.body Warnings

**WARNING**: `req.body` is fully parsed after file uploads have finished. Accessing `req.body` prematurely may cause errors. The `req` and `res` parameters are added to some functions to allow the developer to access properties other than `req.body`, such as session variables or socket.io objects. You have been forwarned! :)

## [MIT Licensed](LICENSE)
