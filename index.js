var path = require('path');
var Busboy = require('busboy');
var mkdirp = require('mkdirp');
var is = require('type-is');
var qs = require('qs');

var extend = require('xtend')

var diskStorage = require('./storage/disk')
var memoryStorage = require('./storage/memory')

module.exports = function(options) {

  options = options || {};
  options.includeEmptyFields = options.includeEmptyFields || false;
  options.inMemory = options.inMemory || false;
  options.putSingleFilesInArray = options.putSingleFilesInArray || false;

  function legacyFilename () {
    if (!options.rename) return undefined
    return function (req, file, cb) {
      var result
      try { result = options.rename(file.fieldname, file.legacyName, req, file.legacyRes) }
      catch (err) { return cb(err) }
      cb(null, result + file.legacyExt)
    }
  }

  function legacyDestination () {
    if (!options.dest && !options.changeDest) return undefined
    if (!options.changeDest) return options.dest
    if (options.dest) mkdirp.sync(options.dest)
    return function (req, file, cb) {
      var result
      try { result = options.changeDest(options.dest, req, file.legacyRes) }
      catch (err) { return cb(err) }
      cb(null, result)
    }
  }

  var storage;
  if (options.storage) {
    storage = options.storage
  } else if (options.inMemory) {
    storage = memoryStorage()
  } else {
    storage = diskStorage({
      filename: legacyFilename(),
      destination: legacyDestination()
    })
  }

  return function (req, res, next) {

    var readFinished = false;
    var fileCount = 0;

    req.body = req.body || {};
    req.files = req.files || {};

    if (is(req, ['multipart'])) {
      if (options.onParseStart) { options.onParseStart(); }

      var busboy = new Busboy(extend(options, { headers: req.headers }))

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

        // don't attach to the files object, if there is no file
        if (!filename) return fileStream.resume();

        // defines is processing a new file
        fileCount++;

        var legacyExt = path.extname(filename)
        var legacyName = path.basename(filename, legacyExt)

        var file = {
          legacyExt: legacyExt,
          legacyName: legacyName,
          legacyRes: res,

          fieldname: fieldname,
          originalname: filename,
          encoding: encoding,
          mimetype: mimetype,

          stream: fileStream

          // name: newFilename,
          // path: newFilePath,
          // extension: (ext === '') ? '' : ext.replace('.', ''),
          // size: 0,
          // truncated: null,
          // buffer: null
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

        function onError (err) {
          if (options.onError) return options.onError(err, next)
          next(err)
        }

        fileStream.on('error', onError)

        storage.handleFile(req, file, function (err, info) {
          if (err) return onError(err)

          file.truncated = fileStream.truncated;
          if (!req.files[fieldname]) { req.files[fieldname] = []; }

          var legacy = { name: path.basename(info.path), buffer: null }
          var fileInfo = extend(file, legacy, info)
          delete fileInfo.legacyRes
          delete fileInfo.req
          req.files[fieldname].push(fileInfo);

          // trigger "file end" event
          if (options.onFileUploadComplete) { options.onFileUploadComplete(file, req, res); }

          // defines has completed processing one more file
          fileCount--;
          onFinish();
        })

        fileStream.on('limit', function () {
          if (options.onFileSizeLimit) { options.onFileSizeLimit(file); }
        });

      });

      if (options.onPartsLimit) busboy.on('partsLimit', options.onPartsLimit)
      if (options.onFilesLimit) busboy.on('filesLimit', options.onFilesLimit)
      if (options.onFieldsLimit) busboy.on('fieldsLimit', options.onFieldsLimit)

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
