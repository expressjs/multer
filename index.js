var os = require('os');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var Busboy = require('busboy');
var mkdirp = require('mkdirp');
var is = require('type-is');
var qs = require('qs');

module.exports = function(options) {

  options = options || {};
  options.includeEmptyFields = options.includeEmptyFields || false;
  options.inMemory = options.inMemory || false;
  options.putSingleFilesInArray = options.putSingleFilesInArray || false;

  // if the destination directory does not exist then assign uploads to the operating system's temporary directory
  var dest;

  if (options.dest) {
    dest = options.dest;
  } else {
    dest = os.tmpdir();
  }

  mkdirp(dest, function(err) { if (err) throw err; });

  // renaming function for the destination directory
  var changeDest = options.changeDest || function(dest, req, res) {
    return dest;
  };

  // renaming function for the uploaded file - need not worry about the extension
  // ! if you want to keep the original filename, write a renamer function which does that
  var rename = options.rename || function(fieldname, filename, req, res) {
    var random_string = fieldname + filename + Date.now() + Math.random();
    return crypto.createHash('md5').update(random_string).digest('hex');
  };

  return function(req, res, next) {

    var readFinished = false;
    var fileCount = 0;

    req.body = req.body || {};
    req.files = req.files || {};

    if (is(req, ['multipart'])) {
      if (options.onParseStart) { options.onParseStart(); }

      // add the request headers to the options
      options.headers = req.headers;

      var busboy = new Busboy(options);

      // handle text field data
      busboy.on('field', function(fieldname, val, valTruncated, keyTruncated) {

        // if includeEmptyFields is false and there is no value then don't
        // attach the fields to req.body
        if (!options.includeEmptyFields && !val) return;

        if (req.body.hasOwnProperty(fieldname)) {
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

        // don't attach to the files object, if there is no file
        if (!filename) return fileStream.resume();

        // defines is processing a new file
        fileCount++;

        if (filename.indexOf('.') > 0) { ext = '.' + filename.split('.').slice(-1)[0]; }
        else { ext = ''; }

        newFilename = rename(fieldname, filename.replace(ext, ''), req, res) + ext;
        newFilePath = path.join(changeDest(dest, req, res), newFilename);

        var file = {
          fieldname: fieldname,
          originalname: filename,
          name: newFilename,
          encoding: encoding,
          mimetype: mimetype,
          path: newFilePath,
          extension: (ext === '') ? '' : ext.replace('.', ''),
          size: 0,
          truncated: null,
          buffer: null
        };

        // trigger "file upload start" event
        if (options.onFileUploadStart) {
          var proceed = options.onFileUploadStart(file, req, res);
          // if the onFileUploadStart handler returned null, it means we should proceed further, discard the file!
          if (proceed == false) {
            fileCount--;
            return fileStream.resume();
          }
        }

        var bufs = [];
        var ws;

        if (!options.inMemory) {
          ws = fs.createWriteStream(newFilePath);
          fileStream.pipe(ws);
        }

        fileStream.on('data', function(data) {
          if (data) { 
            if (options.inMemory) bufs.push(data);
            file.size += data.length; 
          }
          // trigger "file data" event
          if (options.onFileUploadData) { options.onFileUploadData(file, data, req, res); }
        });

        function onFileStreamEnd() {
          file.truncated = fileStream.truncated;
          if (!req.files[fieldname]) { req.files[fieldname] = []; }
          if (options.inMemory) file.buffer = Buffer.concat(bufs, file.size);
          req.files[fieldname].push(file);

          // trigger "file end" event
          if (options.onFileUploadComplete) { options.onFileUploadComplete(file, req, res); }

          // defines has completed processing one more file
          fileCount--;
          onFinish();
        }

        if (options.inMemory)
          fileStream.on('end', onFileStreamEnd);
        else
          ws.on('finish', onFileStreamEnd);

        fileStream.on('error', function(error) {
          // trigger "file error" event
          if (options.onError) { options.onError(error, next); }
          else next(error);
        });

        fileStream.on('limit', function () {
          if (options.onFileSizeLimit) { options.onFileSizeLimit(file); }
        });

        function onFileStreamError(error) {
          // trigger "file error" event
          if (options.onError) { options.onError(error, next); }
          else next(error);
        }

        if (options.inMemory)
          fileStream.on('error', onFileStreamError );
        else 
          ws.on('error', onFileStreamError );

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
        readFinished = true;
        onFinish();
      });

      /**
       * Pass the control to the next middleware in stack
       * only if the read and write stream are finished
       */
      var onFinish = function () {
        if (!readFinished || fileCount > 0) return;

        if (!options.putSingleFilesInArray) {
          for (var field in req.files) {
            if (req.files[field].length === 1) {
              req.files[field] = req.files[field][0];
            }
          }
        }

        // Parse the body and create a best structure
        req.body = qs.parse(req.body);

        // when done parsing the form, pass the control to the next middleware in stack
        if (options.onParseEnd) { options.onParseEnd(req, next); }
        else { next(); }
      };

      req.pipe(busboy);

    }

    else { return next(); }

  }

}
