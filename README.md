Multer
======

Multer is a Connect / Express middleware for handling **multipart/form-data**. It is written on top of [busboy](https://github.com/mscdex/busboy) for maximum efficiency. 

## Usage

Install the Multer package from npm:

    $ npm install multer

Include the Multer middleware in your app:

    ...
    var multer = require('multer');
    app.use(multer({ dest: './uploads/'}));
    ...

You can access the fields and files in the `request` object:

    console.log(req.body);
    console.log(req.files);

**IMPORTANT**: Multer will not process any form which is not **multipart/form-data** submitted via the **POST** method.

## Multer file object

A multer file object is a JSON object with the following properties.

1. `fieldname` - Field name specified in the form
2. `originalname` - Name of the file on the user's computer
3. `name` - Renamed file name
4. `encoding` - Encoding type of the file
5. `mimetype` - Mime type of the file
6. `path` - Location of the uploaded file
7. `extension` - Extension of the file

## Options

Multer accepts an options object, the most basic of which is the `dest` property, which tells Multer where to upload the files. In case you omit the options object, the file will be renamed and uploaded to the temporary directory of the system.

By the default, Multer will rename the files so as to avoid name conflicts. The renaming function can be customized according to your needs.

The following are the options that can be passed to Multer.

* `dest`
* `limits`
* `rename(fieldname, filename)`
* `onFileUploadStart(file)`
* `onFileUploadData(file, data)`
* `onFileUploadComplete(file)`
* `onParseStart()`
* `onParseEnd()`
* `onError()`
* `onFilesLimit()`
* `onFieldsLimit()`
* `onPartsLimit()`

Apart from these, Multer also supports more advanced [busboy options](https://github.com/mscdex/busboy#busboy-methods) like `highWaterMark`, `fileHwm`, and `defCharset`.

In an average web app, only `dest` and `rename` might be required, and configured as shown in the example.

    app.use(multer({
      dest: './uploads/',
      rename: function(fieldname, filename) {
        return filename.replace(/\W+/g, '-').toLowerCase() + Date.now();
      }
    }));

The details of the properties of the options object is explained in the following sections.

###dest

The destination directory for the uploaded files.

Example:

    dest: './uploads/'

###limits

An object specifying the size limits of the following optional properties.

* `fieldNameSize` - integer - Max field name size (Default: 100 bytes)
* `fieldSize` - integer - Max field value size (Default: 1MB)
* `fields` - integer - Max number of non-file fields (Default: Infinity)
* `fileSize` - integer - For multipart forms, the max file size (Default: Infinity)
* `files` - integer - For multipart forms, the max number of file fields (Default: Infinity)
* `parts` - integer - For multipart forms, the max number of parts (fields + files) (Default: Infinity)
* `headerPairs` - integer - For multipart forms, the max number of header key=>value pairs to parse Default: 2000 (same as node's http).

Example:

    limits: {
      fieldNameSize: 100,
      files: 2,
      fields: 5
    }

Specifying the limits can help protect your site against denial of service (DoS) attacks.

###rename(fieldname, filename)

Function to rename the uploaded files. Whatever the function returns will become the new name of the uploaded file (extension is not included). The `fieldname` and `filename` of the file will be available in this function, use them if you need to.

Example:

    rename: function(fieldname, filename) {
      return fieldname + filename + Date.now();
    }

###onFileUploadStart(file)

Event handler triggered when a file starts to be uploaded. A file object with the following properties are available to this function: `fieldname`, `originalname`, `name`, `encoding`, `mimetype`, `path`, `extension`.

Example:

    onFileUploadStart: function(file) {
      console.log(file.fieldname + ' is starting ...');
    }

###onFileUploadData(file, data)

Event handler triggered when a chunk of buffer is received. A buffer object along with a file object is available to the function.

Example:

    onFileUploadData: function(file, data) {
      console.log(data.lenth + ' of ' + file.fieldname + ' arrived');
    }

###onFileUploadComplete(file)

Event handler trigger when a file is completely uploaded. A file object is available to the function.

Example:

    onFileUploadComplete: function(file) {
      console.log(file.fieldname + ' uploaded to  ' + file.path);
    }

###onParseStart()

Event handler triggered when the form parsing starts.

Example:

    onParseStart: function() {
      console.log('Form parsing started at: ', new Date());
    }

###onParseEnd()

Event handler triggered when the form parsing completes.

Example:

    onParseStart: function() {
      console.log('Form parsing completed at: ', new Date());
    }

###onError()

Event handler for any errors encountering while processing the form. The `error` object and the `next` object is available to the function. If you are handling errors yourself, make sure to terminate the request or call the `next()` function, else the request will be left hanging.

Example:

    onError: function(error, next) {
      console.log(error);
      next(error);
    }

###onFilesLimit()

Event handler triggered when the number of files exceed the specification in the `limit` object. No more files will be parsed after the limit is reached.

Example:

    onFilesLimit = function() {
      console.log('Crossed file limit!');
    };

###onFieldsLimit()

Event handler triggered when the number of fields exceed the specification in the `limit` object. No more fields will be parsed after the limit is reached.

Example:

    onFilesLimit = function() {
      console.log('Crossed fields limit!');
    };

###onPartsLimit()

Event handler triggered when the number of parts exceed the specification in the `limit` object. No more files or fields will be parsed after the limit is reached.

Example:

    onFilesLimit = function() {
      console.log('Crossed parts limit!');
    };

## License (MIT)

Copyright (c) 2014 Hage Yaapa <[http://www.hacksparrow.com](http://www.hacksparrow.com)>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.