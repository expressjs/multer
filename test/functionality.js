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


})