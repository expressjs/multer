var fs = require('fs');
var mkdirp = require('mkdirp')
var rimraf = require('rimraf');
var expect = require('chai').expect
var request = require('supertest');
var express = require('express');
var multer = require('../');

function generateFilename (req, file, cb) {
  cb(null, file.fieldname + file.originalname)
}

function requestHandler (req, res, next) {
  res.json({ body: req.body, files: req.files })
}

describe('Functionality', function () {

    // delete the temp dir after the tests are run
    after(function (done) { rimraf('./temp', done) })
    after(function (done) { rimraf('./temp2', done) })
    after(function (done) { rimraf('./temp3', done) })

    var app = express();
    var storage = multer.diskStorage({
      destination: './temp',
      filename: generateFilename
    })
    app.use(multer({ storage: storage }))
    app.post('/', requestHandler);


    it('should upload the file to the `dest` dir', function (done) {
        request(app)
            .post('/')
            .type('form')
            .attach('small0', __dirname + '/files/small0.dat')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(err).to.be.null;
                expect(fs.existsSync('./temp/small0small0.dat')).to.equal(true);
                done();
            })
    })


    it('should rename the uploaded file', function (done) {
        request(app)
            .post('/')
            .type('form')
            .attach('small0', __dirname + '/files/small0.dat')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(err).to.be.null;
                expect(form.files.small0[0].filename).to.equal('small0small0.dat');
                done();
            })
    })

    var app2 = express();
    var storage = multer.diskStorage({
      destination: './temp2',
      filename: generateFilename
    })
    app2.use(multer({ storage: storage }))
    app2.post('/', requestHandler);

    it('should ensure all req.files values (single-file per field) point to an array', function (done) {
        request(app2)
            .post('/')
            .type('form')
            .attach('tiny0', __dirname + '/files/tiny0.dat')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(err).to.be.null;
                expect(form.files.tiny0.length).to.equal(1);
                expect(form.files.tiny0[0].filename).to.equal('tiny0tiny0.dat');
                done();
            })
    })

    it('should ensure all req.files values (multi-files per field) point to an array', function (done) {
        request(app2)
            .post('/')
            .type('form')
            .attach('small0', __dirname + '/files/small0.dat')
            .attach('small0', __dirname + '/files/small1.dat')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(err).to.be.null;
                expect(form.files.small0.length).to.equal(2);
                expect(form.files.small0[0].filename).to.equal('small0small0.dat');
                expect(form.files.small0[1].filename).to.equal('small0small1.dat');
                done();
            })
    })

    var app3 = express();
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        mkdirp('./temp3/user1', function (err) {
          if (err) return cb(err)

          cb(null, './temp3/user1')
        })
      },
      filename: generateFilename
    })
    app3.use(multer({ storage: storage }));
    app3.post('/', requestHandler);

    it('should rename the `dest` directory to a different directory', function (done) {
        request(app3)
            .post('/')
            .type('form')
            .attach('small0', __dirname + '/files/small0.dat')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(err).to.be.null;
                expect(fs.existsSync('./temp3/user1/small0small0.dat')).to.equal(true);
                done();
            })
    })

})
