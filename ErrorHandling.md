# Multer Error Handling

As was documented in [the README](/README.md), there are two ways of dealing with errors in multer.

**`automatic`** This is the default mode. When encountering an error, multer
will remove files that have already been uploaded, and then delegate the error
to express. You can display a nice error page using
[the standard express way](http://expressjs.com/guide/error-handling.html).

**`manual`** If you want more control over what happens when an error is
encountered, then this mode is for you. No files will automatically be removed,
and the standard error handler will not be called.

## Example: Manual

The example below shows how a developer may use error handling in `manual` mode.
It uses multer's `fields()` function to create the middleware instance.
Pass into `fields()` an array of fieldnames that are allowed to be parsed from the client,
and, for each field, the maximum number of files that can be uploaded for this field.
Exceeding the `maxCount` will trigger the error that must be handled in the `next()` middleware function, since `errorHandling` is set to `manual`.

```javascript
var express = require('express')
var multer  = require('multer')
// explicitly set "manual" because the default is "automatic"
var upload = multer({ dest: 'uploads/', errorHandling: 'manual' })

var app = express()

// get the middleware instance by invoking fields(), passing into fields() those file input fields that are allowed
var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 2 }])

app.post('/cool-profile', cpUpload, function (req, res, next) {

	// By invoking "upload.fields()" to create the middleware instance,
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //   req.files['avatar'][0] -> File
  //   req.files['gallery'] -> Array

	// in "manual" mode, req.uploadError is set by multer
	if (req.uploadError) {

		console.log(req.uploadError);

		// manually remove any files that were uploaded
		if (req.files) {
			for (var key in req.files) {
				console.log('deleting files associated with input name "' + key + '"');

				// iterate over file array
				for (var i = 0; i < req.files[key].length; i++) {
					console.log("deleted " + req.files[key][i].path);
					fs.unlink(req.files[key][i].path);
					req.files[key][i].isDeleted = true;
				}
			}
		}
	}

	// handle the response here
})
```
