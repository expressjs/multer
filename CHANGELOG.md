# Change log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 1.4.4 - 2021-12-07

- Bugfix: Handle missing field names (#913)
- Docs: Add Vietnamese translation (#803)
- Docs: Improve Spanish translation (#948)

## 1.4.3 - 2021-08-09

- Bugfix: Avoid deprecated pseudoRandomBytes function (#774)
- Docs: Add Português Brazil translation for README (#758)
- Docs: Clarify the callback calling convention (#775)
- Docs: Add example on how to link to html multipart form (#580)
- Docs: Add Spanish translation for README (#838)
- Docs: Add Math.random() to storage filename example (#841)
- Docs: Fix mistakes in russian doc (#869)
- Docs: Improve Português Brazil translation (#877)
- Docs: Update var to const in all Readmes (#1024)
- Internal: Bump mkdirp version (#862)
- Internal: Bump Standard version (#878)

## 1.4.2 - 2019-07-16

- Docs: Add Russian translation for README (#662)
- Docs: Patch zh-CN README base on newest README (#670)
- Docs: Fix broken link in Readme (#679)
- Docs: Fix broken link in Chinese Readme (#730)
- Docs: Fix typo in Russian README (#738)
- Docs: Add unit for fieldSize in busboy limit params (#734)
- Internal: Make unit tests comaptible with Node.js 13.x (#752)

## 1.4.1 - 2018-10-11

- Bugfix: Make sure that req.file.buffer always is a Buffer

## 1.4.0 - 2018-09-26

- Feature: Make Multer errors inherit from MulterError

## 1.3.1 - 2018-06-28

- Bugfix: Bump vulnerable dependency

## 1.3.0 - 2017-01-25

- Feature: Expose preservePath option

## 1.2.1 - 2016-12-14

- Bugfix: Prevent Multiple Errors from Crashing

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
