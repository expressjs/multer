# Change log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## unreleased

- Support node >=18.0.0

## 3.0.0-alpha.1 - 2025-05-23

- No functional changes compared to `2.0.0-rc.4`.
- Version bump to `3.0.0-alpha.1` due to a security release in the `1.x` line, ensuring compliance with Semantic Versioning.

## 2.0.0 - 2025-05-19

- **Breaking change: The minimum supported Node version is now 10.16.0**
- Fix [CVE-2025-47935](https://www.cve.org/CVERecord?id=CVE-2025-47935) ([GHSA-44fp-w29j-9vj5](https://github.com/expressjs/multer/security/advisories/GHSA-44fp-w29j-9vj5))
- Fix [CVE-2025-47944](https://www.cve.org/CVERecord?id=CVE-2025-47944) ([GHSA-4pg4-qvpc-4q3h](https://github.com/expressjs/multer/security/advisories/GHSA-4pg4-qvpc-4q3h))

## 2.0.0-rc.4 - 2022-05-27
- Bugfix: commpatibility with Node.js < 16 
- deps: fs-temp@^2.0.1

## 2.0.0-rc.3 - 2021-06-29

- Breaking: Convert package to ESM

Migration Guide:

This relases changes the package from a Common JS module to an EcmaScript module, and drops support for older versions of Node.

- The minimum version of Node.js supported is now: `12.20.0`, `14.13.1`, and `16.0.0`
- The package must now be imported using the native `import` syntax instead of with `require`

## 2.0.0-rc.2 - 2020-03-15

- Allow limits to be passed as string, e.g. `'12MB'`
- Remove `parts` limit in favour of `fields` & `files`
- Set reasonable defaults for all limits

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

## 1.4.5-lts.2

- Fix out-of-band error event from busboy (#1177)

## 1.4.5-lts.1

- No changes

## 1.4.4-lts.1

- Bugfix: Bump busboy to fix CVE-2022-24434 (#1097)
- Breaking: Require Node.js 10.16.0 or later (#1097)

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
