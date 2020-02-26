# Change log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 2.0.0-rc.1 - 2020-02-26

- Breaking: drop support for Node.js < 10.13.x
- Internal: achive 100% code coverage
- Internal: test on macOS & Windows

## 2.0.0-beta.1 - 2019-11-23

- Breaking: drop support for Node.js < 8.3.x

## 2.0.0-alpha.7 - 2019-05-03

- Breaking: drop support for Node.js < 6.x

## 2.0.0-alpha.6 - 2017-02-18

- Fix: handle client aborting request

## 2.0.0-alpha.5 - 2017-02-14

- Fix: allow files without filename

## 2.0.0-alpha.4 - 2017-02-14

- Feature: add file type detection

## 2.0.0-alpha.3 - 2016-12-22

- Feature: unlink file as soon as it's opened

## 2.0.0-alpha.2 - 2016-10-02

- Feature: use LIMIT_FILE_COUNT when receiving too many files

## 2.0.0-alpha.1 - 2016-10-01

- Feature: switch to stream based API
- Feature: throw error when passing old options

## 1.2.0 - 2016-08-04

- Feature: add .none() for accepting only fields

## 1.1.0 - 2015-10-23

- Feature: accept any file, regardless of fieldname

## 1.0.6 - 2015-10-03

- Bugfix: always report limit errors

## 1.0.5 - 2015-09-19

- Bugfix: drain the stream before considering request done

## 1.0.4 - 2015-09-19

- Bugfix: propagate all errors from busboy

## 1.0.3 - 2015-08-06

- Bugfix: ensure file order is correct

## 1.0.2 - 2015-08-06

- Bugfix: don't hang when hitting size limit

## 1.0.1 - 2015-07-20

- Bugfix: decrement pending writes on error

## 1.0.0 - 2015-07-18

- Introduce storage engines
- Specify expected fields
- Follow the W3C JSON form spec
