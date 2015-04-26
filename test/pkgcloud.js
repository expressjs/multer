var fs = require('fs');
var rimraf = require('rimraf');
var expect = require('chai').expect
var request = require('supertest');
var express = require('express');
var multer = require('../');
var pkgcloud = require('pkgcloud');
var pkgConfig = require('./pkgconfig/config.js');
var client = pkgcloud.storage.createClient(pkgConfig);

var id = Date.now() + '_' + Math.round(Math.random() * 10000000000);
var firstContainerName = 'alreadyExistingContainer_' + id;
var secondContainerName = 'notExistingContainer_' + id;
var fileName = 'myCoolFile_' + id;

describe('pkgcloud Functionality', function() {
	this.timeout(10000);

	after(function(done) {
		client.destroyContainer(firstContainerName, function(err) {
			client.destroyContainer(secondContainerName, function(err) {
				done();
			});
		});
	});
	before(function(done) {
		client.createContainer(firstContainerName, function(err, container) {
			if (err == null) {
				done();
			}
		});
	});

	it('should upload a file into a existing container', function(done) {

		var app = express();
		app.use(multer({
			pkgCloudClient: client,
			changePkgOptions: function(options, filename, req, res) {
				options.container = firstContainerName;
				options.remote = fileName;
				return options;
			}
		}));
		app.post('/', function(req, res) {
			var form = {
				body: req.body,
				files: req.files
			}
			res.send(form);
		});

		request(app)
			.post('/')
			.type('form')
			.attach('small0', __dirname + '/files/small0.dat')
			.expect(200)
			.end(function(err, res) {
				var form = res.body;
				expect(err).to.be.null;
				// Check if file has been uploaded and container exists
				client.getFiles(firstContainerName, function(err, files) {
					expect(err).to.be.null;
					var found = false;
					for(var i in files){
						if(files[i].name === fileName+'.dat'){
							found = true;
							break;
						}
					}
					expect(found).to.be.true;
					done();
				});
			})
	});

	it('should upload a file into a NOT existing container', function(done) {

		var app = express();
		app.use(multer({
			pkgCloudClient: client,
			changePkgOptions: function(options, filename, req, res) {
				options.container = secondContainerName;
				options.remote = fileName;
				return options;
			}
		}));
		app.post('/', function(req, res) {
			var form = {
				body: req.body,
				files: req.files
			}
			res.send(form);
		});

		request(app)
			.post('/')
			.type('form')
			.attach('small0', __dirname + '/files/small0.dat')
			.expect(200)
			.end(function(err, res) {
				var form = res.body;
				expect(err).to.be.null;
				// Check if file has been uploaded and container exists
				client.getFiles(secondContainerName, function(err, files) {
					expect(err).to.be.null;
					var found = false;
					for(var i in files){
						if(files[i].name === fileName+'.dat'){
							found = true;
							break;
						}
					}
					expect(found).to.be.true;
					done();
				});
			})
	});

});
