Multer
======

Multer is a Connect middleware for handling **multipart/form-data**. It can be used with both Connect and Express, seamlessly. It is based on [busboy](https://github.com/mscdex/busboy). 

## Usage

Install the Multer package from npm:

    $ npm install multer

Include the Multer middleware in your app:

    ...
    var multer = require('multer');
    app.use(multer({ dest: './uploads/'}));
    ...

**IMPORTANT**: Multer will not process any form which not **multipart/form-data** submitted via the **POST** method.

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

Multer accepts an options object, the most basic of which is the `dest` property, which tells Multer where to upload the files to. In case you omit the options object, the file will be renamed and uploaded to the temporary directory of the system.

By the default, Multer will rename the files so as to avoid name conflicts. The renaming function can be customized according to your needs.

The following are the options that can be passed to Multer.

1. `dest`
2. `rename(fieldname, filename)`
3. `onFileUploadStart(file)`
4. `onFileUploadData(file, data)`
5. `onFileUploadComplete(file)`
6. `onParseStart()`
7. `onParseEnd()`
8. `onError()`

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