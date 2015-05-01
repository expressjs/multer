var expect = require('chai').expect
var request = require('supertest');
var express = require('express');
var multer = require('../');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var path = require('path');

var dest = './temp';

// node >v10 does not parse JSON buffer too a buffer so we must detect and create a buffer within these mocha tests
function createBuffer(buff) {
    return (buff !== undefined && Buffer.isBuffer(buff)) ? buff : new Buffer(buff);
}

describe('InMemory', function () {

    // the mocha default 2000 ms fails in Travis builds
    // related to multer issue #65
    this.timeout(10000);

    // create the temp dir
    before(function (done) { mkdirp(dest, function(err) { done(); }); });

    // delete the temp dir after the tests are run
    after(function (done) { rimraf(dest, done); });

    var app = express();
    app.use(multer({
        inMemory: true
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
                expect(createBuffer(form.files.small0.buffer).length).to.equal(form.files.small0.size);
                expect(form.files.small0.path).to.equal.undefined;

                done();
            })
    })

    it('should not process empty fields and an empty file', function (done) {

        request(app)
            .post('/')
            .type('form')
            .attach('empty', __dirname + '/files/empty.dat')
            .field('name', 'Multer')
            .field('version', '')
            .field('year', '')
            .field('checkboxfull', 'cb1')
            .field('checkboxfull', 'cb2')
            .field('checkboxhalfempty', 'cb1')
            .field('checkboxhalfempty', '')
            .field('checkboxempty', '')
            .field('checkboxempty', '')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(err).to.be.null;
                expect(form.body).to.be.an('object');
                expect(form.body).to.have.property('name');
                expect(form.body).not.to.have.property('version');
                expect(form.body).not.to.have.property('year');
                expect(form.body.checkboxfull).to.be.an('array');
                expect(form.body.checkboxfull).to.deep.equal(['cb1', 'cb2']);
                expect(form.body.checkboxhalfempty).to.equal('cb1');
                expect(form.body).to.not.have.property('checkboxempty');
                expect(form.files.empty).to.have.property('fieldname');
                expect(form.files.empty.fieldname).to.equal('empty');
                expect(form.files.empty).to.have.property('originalname');
                expect(form.files.empty.originalname).to.equal('empty.dat');
                expect(form.files.empty).to.have.property('size');
                expect(form.files.empty.size).to.equal(0);
                expect(form.files.empty).to.have.property('truncated');
                expect(form.files.empty.truncated).to.equal(false);
                expect(createBuffer(form.files.empty.buffer).length).to.equal(form.files.empty.size);
                done();
            })
    })

    it('should process multiple files', function (done) {

        request(app)
            .post('/')
            .type('form')
            .attach('empty', __dirname + '/files/empty.dat')
            .attach('tiny0', __dirname + '/files/tiny0.dat')
            .attach('tiny1', __dirname + '/files/tiny1.dat')
            .attach('small0', __dirname + '/files/small0.dat')
            .attach('small1', __dirname + '/files/small1.dat')
            .attach('medium', __dirname + '/files/medium.dat')
            .attach('large', __dirname + '/files/large.jpg')
            .expect(200)
            .end(function (err, res) {
                var form = res.body;
                expect(form.body).to.be.an('object');
                expect(Object.keys(form.body).length).to.equal(0);
                expect(form.files).to.be.an('object');
                expect(Object.keys(form.files).length).to.equal(7);

                expect(form.files).to.have.property('empty');
                expect(form.files.empty).to.have.property('fieldname');
                expect(form.files.empty.fieldname).to.equal('empty');
                expect(form.files.empty).to.have.property('originalname');
                expect(form.files.empty.originalname).to.equal('empty.dat');
                expect(form.files.empty).to.have.property('size');
                expect(form.files.empty.size).to.equal(0);
                expect(form.files.empty).to.have.property('truncated');
                expect(form.files.empty.truncated).to.equal(false);
                expect(createBuffer(form.files.empty.buffer).length).to.equal(form.files.empty.size);

                expect(form.files).to.have.property('tiny0');
                expect(form.files.tiny0).to.have.property('fieldname');
                expect(form.files.tiny0.fieldname).to.equal('tiny0');
                expect(form.files.tiny0).to.have.property('originalname');
                expect(form.files.tiny0.originalname).to.equal('tiny0.dat');
                expect(form.files.tiny0).to.have.property('size');
                expect(form.files.tiny0.size).to.equal(122);
                expect(form.files.tiny0).to.have.property('truncated');
                expect(form.files.tiny0.truncated).to.equal(false);
                expect(createBuffer(form.files.tiny0.buffer).length).to.equal(form.files.tiny0.size);

                expect(form.files).to.have.property('tiny1');
                expect(form.files.tiny1).to.have.property('fieldname');
                expect(form.files.tiny1.fieldname).to.equal('tiny1');
                expect(form.files.tiny1).to.have.property('originalname');
                expect(form.files.tiny1.originalname).to.equal('tiny1.dat');
                expect(form.files.tiny1).to.have.property('size');
                expect(form.files.tiny1.size).to.equal(7);
                expect(form.files.tiny1).to.have.property('truncated');
                expect(form.files.tiny1.truncated).to.equal(false);
                expect(createBuffer(form.files.tiny1.buffer).length).to.equal(form.files.tiny1.size);

                expect(form.files).to.have.property('small0');
                expect(form.files.small0).to.have.property('fieldname');
                expect(form.files.small0.fieldname).to.equal('small0');
                expect(form.files.small0).to.have.property('originalname');
                expect(form.files.small0.originalname).to.equal('small0.dat');
                expect(form.files.small0).to.have.property('size');
                expect(form.files.small0.size).to.equal(1778);
                expect(form.files.small0).to.have.property('truncated');
                expect(form.files.small0.truncated).to.equal(false);
                expect(createBuffer(form.files.small0.buffer).length).to.equal(form.files.small0.size);

                expect(form.files).to.have.property('small1');
                expect(form.files.small1).to.have.property('fieldname');
                expect(form.files.small1.fieldname).to.equal('small1');
                expect(form.files.small1).to.have.property('originalname');
                expect(form.files.small1.originalname).to.equal('small1.dat');
                expect(form.files.small1).to.have.property('size');
                expect(form.files.small1.size).to.equal(315);
                expect(form.files.small1).to.have.property('truncated');
                expect(form.files.small1.truncated).to.equal(false);
                expect(createBuffer(form.files.small1.buffer).length).to.equal(form.files.small1.size);

                expect(form.files).to.have.property('medium');
                expect(form.files.medium).to.have.property('fieldname');
                expect(form.files.medium.fieldname).to.equal('medium');
                expect(form.files.medium).to.have.property('originalname');
                expect(form.files.medium.originalname).to.equal('medium.dat');
                expect(form.files.medium).to.have.property('size');
                expect(form.files.medium.size).to.equal(13196);
                expect(form.files.medium).to.have.property('truncated');
                expect(form.files.medium.truncated).to.equal(false);
                expect(createBuffer(form.files.medium.buffer).length).to.equal(form.files.medium.size);

                expect(form.files).to.have.property('large');
                expect(form.files.large).to.have.property('fieldname');
                expect(form.files.large.fieldname).to.equal('large');
                expect(form.files.large).to.have.property('originalname');
                expect(form.files.large.originalname).to.equal('large.jpg');
                expect(form.files.large).to.have.property('size');
                expect(form.files.large.size).to.equal(2413677);
                expect(form.files.large).to.have.property('truncated');
                expect(form.files.large.truncated).to.equal(false);
                expect(createBuffer(form.files.large.buffer).length).to.equal(form.files.large.size);

                done();
            })
    })

})
