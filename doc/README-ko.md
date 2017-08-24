Multer 한국어 번역 페이지 입니다.

# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer는 파일 업로드를 위해 사용되는 `multipart/form-data` 를 다루기 위한 node.js 의 미들웨어 입니다. 효율성을 최대화 하기 위해 [busboy](https://github.com/mscdex/busboy) 위에 쓰여졌습니다.

**주**: Multer는 multipart (`multipart/form-data`)가 아닌 폼에서는 동작하지 않습니다.

## 번역

이 문서는 아래의 언어로도 제공됩니다:
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (중국어)

## 설치

```sh
$ npm install --save multer
```

## 사용법

Multer는 `body` 객체와 한 개의 `file` 혹은 여러개의 `files` 객체를 `request` 객체에 추가합니다. `body` 객체는 폼 텍스트 필드의 값을 포함하고, 한 개 혹은 여러개의 파일 객체는 폼을 통해 업로드된 파일들을 포함하고 있습니다.

기본 사용 예제:

```javascript
var express = require('express')
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var app = express()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
})

var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
})
```

In case you need to handle a text-only multipart form, you can use any of the multer methods (`.single()`, `.array()`, `fields()`). Here is an example using `.array()`:

```javascript
var express = require('express')
var app = express()
var multer  = require('multer')
var upload = multer()

app.post('/profile', upload.array(), function (req, res, next) {
  // req.body contains the text fields
})
```

## API

### 파일 정보

각각의 파일은 아래의 정보를 포함하고 있습니다:

Key | Description | Note
--- | --- | ---
`fieldname` | 폼에 정의된 필드 명 |
`originalname` | 사용자 컴퓨터 상의 파일 명 |
`encoding` | 파일의 엔코딩 타입 |
`mimetype` | 파일의 Mime 타입 |
`size` | 파일의 바이트(byte) 사이즈 |
`destination` | 파일이 저장된 폴더 | `DiskStorage`
`filename` | `destination` 에 저장된 파일 명 | `DiskStorage`
`path` | 업로드된 파일의 전체 경로 | `DiskStorage`
`buffer` | 전체 파일의 `Buffer` | `MemoryStorage`

### `multer(opts)`

Multer는 옵션 객체를 허용합니다. 그 중 가장 기본 옵션인 `dest` 요소는 Multer에게 파일을 어디로 업로드 할 지를 알려줍니다. 만일 옵션 객체를 생략했다면, 파일은 디스크가 아니라 메모리에 저장될 것 입니다.

기본적으로 Multer는 이름이 중복되는 것을 방지하기 위해서 파일의 이름을 재작성 합니다. 필요에 의해서 해당 함수는 커스터마이징 할 수 있습니다.

Multer로 전달 가능한 옵션들은 다음과 같습니다.

Key | Description
--- | ---
`dest` or `storage` | 파일이 저장될 위치
`fileFilter` | 어떤 파일을 허용할지 제어하는 함수
`limits` | 업로드 된 데이터의 리밋
`preservePath` | 파일의 base name 대신 보존할 파일의 전체 경로

보통의 웹 앱에서는 `dest` 옵션 정도만 필요할지도 모릅니다. 설정 방법은 아래의 예제에 나와있습니다.

```javascript
var upload = multer({ dest: 'uploads/' })
```

만일 업로드를 더 제어하고 싶다면, `dest` 옵션 대신 `storage` 옵션을 사용할 수 있습니다. Multer는 스토리지 엔진인 `DiskStorage` 와 `MemoryStorage` 를 탑재하고 있습니다. More engines are available from third parties.

#### `.single(fieldname)`

Accept a single file with the name `fieldname`. The single file will be stored
in `req.file`.

#### `.array(fieldname[, maxCount])`

Accept an array of files, all with the name `fieldname`. Optionally error out if
more than `maxCount` files are uploaded. The array of files will be stored in
`req.files`.

#### `.fields(fields)`

Accept a mix of files, specified by `fields`. An object with arrays of files
will be stored in `req.files`.

`fields` should be an array of objects with `name` and optionally a `maxCount`.
Example:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Accept only text fields. If any file upload is made, error with code
"LIMIT\_UNEXPECTED\_FILE" will be issued. This is the same as doing `upload.fields([])`.

#### `.any()`

Accepts all files that comes over the wire. An array of files will be stored in
`req.files`.

**WARNING:** Make sure that you always handle the files that a user uploads.
Never add multer as a global middleware since a malicious user could upload
files to a route that you didn't anticipate. Only use this function on routes
where you are handling the uploaded files.

### `storage`

#### `DiskStorage`

The disk storage engine gives you full control on storing files to disk.

```javascript
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

var upload = multer({ storage: storage })
```

There are two options available, `destination` and `filename`. They are both
functions that determine where the file should be stored.

`destination` is used to determine within which folder the uploaded files should
be stored. This can also be given as a `string` (e.g. `'/tmp/uploads'`). If no
`destination` is given, the operating system's default directory for temporary
files is used.

**Note:** You are responsible for creating the directory when providing
`destination` as a function. When passing a string, multer will make sure that
the directory is created for you.

`filename` is used to determine what the file should be named inside the folder.
If no `filename` is given, each file will be given a random name that doesn't
include any file extension.

**Note:** Multer will not append any file extension for you, your function
should return a filename complete with an file extension.

Each function gets passed both the request (`req`) and some information about
the file (`file`) to aid with the decision.

Note that `req.body` might not have been fully populated yet. It depends on the
order that the client transmits fields and files to the server.

#### `MemoryStorage`

The memory storage engine stores the files in memory as `Buffer` objects. It
doesn't have any options.

```javascript
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
```

When using memory storage, the file info will contain a field called
`buffer` that contains the entire file.

**WARNING**: Uploading very large files, or relatively small files in large
numbers very quickly, can cause your application to run out of memory when
memory storage is used.

### `limits`

An object specifying the size limits of the following optional properties. Multer passes this object into busboy directly, and the details of the properties can be found on [busboy's page](https://github.com/mscdex/busboy#busboy-methods).

The following integer values are available:

Key | Description | Default
--- | --- | ---
`fieldNameSize` | Max field name size | 100 bytes
`fieldSize` | Max field value size | 1MB
`fields` | Max number of non-file fields | Infinity
`fileSize` | For multipart forms, the max file size (in bytes) | Infinity
`files` | For multipart forms, the max number of file fields | Infinity
`parts` | For multipart forms, the max number of parts (fields + files) | Infinity
`headerPairs` | For multipart forms, the max number of header key=>value pairs to parse | 2000

Specifying the limits can help protect your site against denial of service (DoS) attacks.

### `fileFilter`

Set this to a function to control which files should be uploaded and which
should be skipped. The function should look like this:

```javascript
function fileFilter (req, file, cb) {

  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted

  // To reject this file pass `false`, like so:
  cb(null, false)

  // To accept the file pass `true`, like so:
  cb(null, true)

  // You can always pass an error if something goes wrong:
  cb(new Error('I don\'t have a clue!'))

}
```

## 에러 핸들링

When encountering an error, multer will delegate the error to express. You can
display a nice error page using [the standard express way](http://expressjs.com/guide/error-handling.html).

If you want to catch errors specifically from multer, you can call the
middleware function by yourself.

```javascript
var upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      // An error occurred when uploading
      return
    }

    // Everything went fine
  })
})
```

## 커스텀 스토리지 엔진

자신만의 고유한 스토리지 엔진을 구축하기 위한 정보를 얻기 위해서는 [Multer Storage Engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md) 문서를 참고하세요.

## 라이센스

[MIT](LICENSE)