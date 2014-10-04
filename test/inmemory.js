var expect = require('chai').expect
var request = require('supertest');
var express = require('express');
var multer = require('../');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var path = require('path');

var dest = './temp';

describe('InMemory', function () {

    // create the temp dir
    before(function (done) { mkdirp(dest, function(err) { done(); }); });

    // delete the temp dir after the tests are run
    after(function (done) { rimraf(dest, done); });

    var app = express();
    app.use(multer({
        dest: dest,
        inMemory: true,
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

    it('should process multipart/form-data POST request', function (done) {

        request(app)
            .post('/')
            .type('form')
            .attach('small0', __dirname + '/files/small0.dat')
            .field('name', 'Multer')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(err).to.be.null;
                expect(form.body).to.be.an('object');
                expect(form.body).to.have.property('name');
                expect(form.body.name).to.equal('Multer');
                expect(form.files).to.be.an('object');
                expect(form.files).to.have.property('small0');
                expect(form.files.small0).to.have.property('fieldname');
                expect(form.files.small0.fieldname).to.equal('small0');
                expect(form.files.small0).to.have.property('originalname');
                expect(form.files.small0.originalname).to.equal('small0.dat');
                expect(form.files.small0).to.have.property('size');
                expect(form.files.small0.size).to.equal(1778);
                expect(form.files.small0).to.have.property('truncated');
                expect(form.files.small0.truncated).to.equal(false);
                expect(form.files.small0.buffer.length).to.equal(form.files.small0.size);

                // The path is explicitly set to null b/c inmemory is true
                // The handler is responsible for writing the inmemory Buffer to file or database
                expect(form.files.small0.path).to.equal(path.join(dest, form.files.small0.name));

                // Verify that Multer did not automatically write out the file.
                expect(fs.existsSync(form.files.small0.path)).to.equal(false);

                // The buffer holds the data, so write it out now.
                fs.writeFileSync(form.files.small0.path, form.files.small0.buffer);

                // Now the file should exist
                expect(fs.existsSync(form.files.small0.path)).to.equal(true);

                done();
            })

    })

})
