var os = require('os');
var fs = require('fs');
var crypto = require('crypto');
var Busboy = require('busboy');
var mkdirp = require('mkdirp');

module.exports = function(options) {

  options = options || {};

  // specify the destination directory, else, the uploads will be moved to the temporary dir of the system
  var dest;
  // some users may ommit the trailing slash
  if (options.dest) { dest = options.dest.slice(-1) == '/' ? options.dest : options.dest + '/'; }
  else { dest = os.tmpdir(); }

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

    //if (req.headers['content-type'] && req.headers['content-type'].indexOf('multipart/form-data') === 0 && req.method === 'POST') {
    if (req.method === 'POST') {
      var busboy = new Busboy({ headers: req.headers });

      // handle text field data
      busboy.on('field', function(fieldname, val, valTruncated, keyTruncated) {
        req.body[fieldname] = val;
      });

      // handle files
      busboy.on('file', function(fieldname, fileStream, filename, encoding, mimetype) {

        var ext = '.' + filename.split('.').slice(-1)[0];
        var newFilename = rename(fieldname, filename.replace(ext, '')) + ext;
        var path = dest + newFilename;

        var file = {
          fieldname: fieldname,
          stream: fileStream,
          originalName: filename,
          name: newFilename,
          encoding: encoding,
          mimetype: mimetype,
          path: path,
          extension: ext.replace('.', '')
        };

        // trigger "file upload start" event
        if (options.onFileUploadStart) { options.onFileUploadStart(file); }

        var ws = fs.createWriteStream(path);
        fileStream.pipe(ws);

        fileStream.on('data', function(data) {
          // trigger "file data" event
          if (options.onFileUploadData) { options.onFileUploadData(file, data); }
        });

        fileStream.on('end', function() {
          req.files[fieldname] = file;
          // trigger "file end" event
          if (options.onFileUploadComplete) { options.onFileUploadComplete(file); }
        });

        fileStream.on('error', function(error) {
          // trigger "file error" event
          if (options.onError) { options.onError(error); }
          else next(error);
        });

      });

      busboy.on('end', function() {
        // when done parsing the form, pass the control to the next middleware in stack
        if (options.onParseEnd) { options.onParseEnd(); }
        next();
      });

      req.pipe(busboy);

    }

    else {
      return next();
    }

  };

};
