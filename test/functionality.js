var fs = require('fs');
var rimraf = require('rimraf');
var expect = require('chai').expect
var request = require('supertest');
var express = require('express');
var multer = require('../');

describe('Functionality', function () {

    // delete the temp dir after the tests are run
    after(function (done) { rimraf('./temp', done); });

    var app = express();
    app.use(multer({
        dest: './temp',
        rename: function (fieldname, filename) {
            return fieldname + filename;
        }
    }));
    app.post('/', function (req, res) {
        var form = {
            body: req.body,
            files: req.files
        }
        res.send(form);
    });


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
                expect(form.files.small0.name).to.equal('small0small0.dat');
                done();
            })
    })

    var app2 = express();
    app2.use(multer({
        dest: './temp',
        putSingleFilesInArray: true,
        rename: function (fieldname, filename) {
            return fieldname + filename;
        }
    }));
    app2.post('/', function (req, res) {
        var form = {
            body: req.body,
            files: req.files
        }
        res.send(form);
    });

    it('should ensure all req.files values point to an array', function (done) {
        request(app2)
            .post('/')
            .type('form')
            .attach('tiny0', __dirname + '/files/tiny0.dat')
            .attach('small0', __dirname + '/files/small0.dat')
            .attach('small0', __dirname + '/files/small1.dat')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(err).to.be.null;
                expect(form.files.tiny0.length).to.equal(1);
                expect(form.files.tiny0[0].name).to.equal('tiny0tiny0.dat');
                expect(form.files.small0.length).to.equal(2);
                expect(form.files.small0[0].name).to.equal('small0small0.dat');
                expect(form.files.small0[1].name).to.equal('small0small1.dat');
                done();
            })
    })

    var app3 = express();
    app3.use(multer({
        dest: './temp',
        renameDestDir: function (dest, req, res) {
            dest += '/user1';
            if (!fs.existsSync(dest)) fs.mkdirSync(dest);
            return dest;
        },
        rename: function (fieldname, filename) {
            return fieldname + filename;
        }
    }));
    app3.post('/', function (req, res) {
        var form = {
            body: req.body,
            files: req.files
        }
        res.send(form);
    });

    it('should rename the `dest` directory to a different directory', function (done) {
        request(app3)
            .post('/')
            .type('form')
            .attach('small0', __dirname + '/files/small0.dat')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(err).to.be.null;
                expect(fs.existsSync('./temp/user1/small0small0.dat')).to.equal(true);
                done();
            })
    })

})