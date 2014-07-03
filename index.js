var os = require('os');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var Busboy = require('busboy');
var mkdirp = require('mkdirp');

module.exports = function(options) {

  options = options || {};

  // specify the destination directory, else, the uploads will be moved to the temporary dir of the system
  var dest;

  if (options.dest) {
    dest = options.dest;
  } else {
    dest = os.tmpdir();
  }

  // make sure the dest dir exists
  mkdirp(dest, function(err) { if (err) throw err; });

  // renaming function for the uploaded file - need not worry about the extension
  // ! if you want to keep the original filename, write a renamer function which does that
  var rename = options.rename || function(fieldname, filename) {
    var random_string = fieldname + filename + Date.now() + Math.random();
    return crypto.createHash('md5').update(random_string).digest('hex');
  };

  return function(req, res, next) {

    req.body = req.body || {};
    req.files = req.files || {};

    if (req.headers['content-type'] &&
        req.headers['content-type'].indexOf('multipart/form-data') === 0 &&
        (req.method === 'POST' || req.method === 'PUT')
    ) {

      if (options.onParseStart) { options.onParseStart(); }

      // add the request headers to the options
      options.headers = req.headers;

      var busboy = new Busboy(options);

      // handle text field data
      busboy.on('field', function(fieldname, val, valTruncated, keyTruncated) {

        // don't attach to the body object, if there is no value
        if (!val) return;

        if (req.body.hasOwnProperty(fieldname) && val) {
          if (Array.isArray(req.body[fieldname])) {
            req.body[fieldname].push(val);
          } else {
            req.body[fieldname] = [req.body[fieldname], val];
          }
        } else {
          req.body[fieldname] = val;
        }

      });

      // handle files
      busboy.on('file', function(fieldname, fileStream, filename, encoding, mimetype) {

        var ext, newFilename, newFilePath;

        // don't attach to the files object, if there is file
        if (!filename) return fileStream.resume();

        ext = '.' + filename.split('.').slice(-1)[0];
        newFilename = rename(fieldname, filename.replace(ext, '')) + ext;
        newFilePath = path.join(dest, newFilename);

        var file = {
          fieldname: fieldname,
          originalname: filename,
          name: newFilename,
          encoding: encoding,
          mimetype: mimetype,
          path: newFilePath,
          extension: (ext === null) ? null : ext.replace('.', ''),
          size: 0,
          truncated: null
        };

        // trigger "file upload start" event
        if (options.onFileUploadStart) { options.onFileUploadStart(file); }

        var ws = fs.createWriteStream(newFilePath);
        fileStream.pipe(ws);

        fileStream.on('data', function(data) {
          if (data) { file.size += data.length; }
          // trigger "file data" event
          if (options.onFileUploadData) { options.onFileUploadData(file, data); }
        });

        fileStream.on('end', function() {
          file.truncated = fileStream.truncated;
          if (!req.files[fieldname]) { req.files[fieldname] = []; }
          req.files[fieldname].push(file);
          // trigger "file end" event
          if (options.onFileUploadComplete) { options.onFileUploadComplete(file); }
        });

        fileStream.on('error', function(error) {
          // trigger "file error" event
          if (options.onError) { options.onError(error, next); }
          else next(error);
        });

        ws.on('error', function(error) {
          // trigger "file error" event
          if (options.onError) { options.onError(error, next); }
          else next(error);
        });

      });

      busboy.on('partsLimit', function() {
        if (options.onPartsLimit) { options.onPartsLimit(); }
      });

      busboy.on('filesLimit', function() {
        if (options.onFilesLimit) { options.onFilesLimit(); }
      });

      busboy.on('fieldsLimit', function() {
        if (options.onFieldsLimit) { options.onFieldsLimit(); }
      });

      busboy.on('finish', function() {
        for (var field in req.files) {
          if (req.files[field].length === 1) {
            req.files[field] = req.files[field][0];
          }
        }
        // when done parsing the form, pass the control to the next middleware in stack
        if (options.onParseEnd) { options.onParseEnd(req); }
        next();
      });

      req.pipe(busboy);

    }

    else { return next(); }

  }

}
