# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer는 파일 업로드를 위해 사용되는 `multipart/form-data` 를 다루기 위한 node.js 의 미들웨어 입니다. 효율성을 최대화 하기 위해 [busboy](https://github.com/mscdex/busboy) 를 기반으로 하고 있습니다.

**주**: Multer는 multipart (`multipart/form-data`)가 아닌 폼에서는 동작하지 않습니다.

## 번역

이 문서는 아래의 언어로도 제공됩니다:

- [العربية](https://github.com/expressjs/multer/blob/master/doc/README-ar.md) (아라비아 말)
- [English](https://github.com/expressjs/multer/blob/master/README.md)
- [English](https://github.com/expressjs/multer/blob/master/README.md) (영어)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (스페인어)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (중국어)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (러시아)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (포르투갈어 BR)

## 설치

```sh
$ npm install --save multer
```

## 사용법

Multer는 `body` 객체와 한 개의 `file` 혹은 여러개의 `files` 객체를 `request` 객체에 추가합니다. `body` 객체는 폼 텍스트 필드의 값을 포함하고, 한 개 혹은 여러개의 파일 객체는 폼을 통해 업로드된 파일들을 포함하고 있습니다.

기본 사용 예제:

```javascript
const express = require('express')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const app = express()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file 은 `avatar` 라는 필드의 파일 정보입니다.
  // 텍스트 필드가 있는 경우, req.body가 이를 포함할 것입니다.
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files 는 `photos` 라는 파일정보를 배열로 가지고 있습니다.
  // 텍스트 필드가 있는 경우, req.body가 이를 포함할 것입니다.
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files는 (String -> Array) 형태의 객체 입니다.
  // 필드명은 객체의 key에, 파일 정보는 배열로 value에 저장됩니다.
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // 텍스트 필드가 있는 경우, req.body가 이를 포함할 것입니다.
})
```

텍스트 전용 multipart 폼을 처리해야 하는 경우, 어떠한 multer 메소드 (`.single()`, `.array()`, `fields()`) 도 사용할 수 있습니다. 아래는 `.array()` 를 사용한 예제 입니다 :

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.array(), function (req, res, next) {
  // req.body는 텍스트 필드를 포함합니다.
})
```

## API

### 파일 정보

각각의 파일은 아래의 정보를 포함하고 있습니다:

Key | Description | Note
--- | --- | ---
`fieldname` | 폼에 정의된 필드 명 |
`originalname` | 사용자가 업로드한 파일 명 |
`encoding` | 파일의 엔코딩 타입 |
`mimetype` | 파일의 Mime 타입 |
`size` | 파일의 바이트(byte) 사이즈 |
`destination` | 파일이 저장된 폴더 | `DiskStorage`
`filename` | `destination` 에 저장된 파일 명 | `DiskStorage`
`path` | 업로드된 파일의 전체 경로 | `DiskStorage`
`buffer` | 전체 파일의 `Buffer` | `MemoryStorage`

### `multer(opts)`

Multer는 옵션 객체를 허용합니다. 그 중 가장 기본 옵션인 `dest` 요소는 Multer에게 파일을 어디로 업로드 할 지를 알려줍니다. 만일 옵션 객체를 생략했다면, 파일은 디스크가 아니라 메모리에 저장될 것 입니다.

기본적으로 Multer는 이름이 중복되는 것을 방지하기 위해서 파일의 이름을 재작성 합니다. 필요에 따라 해당 함수는 커스터마이징이 가능합니다.

Multer로 전달 가능한 옵션들은 다음과 같습니다.

Key | Description
--- | ---
`dest` or `storage` | 파일이 저장될 위치
`fileFilter` | 어떤 파일을 허용할지 제어하는 함수
`limits` | 업로드 된 데이터의 한도
`preservePath` | 파일의 base name 대신 보존할 파일의 전체 경로

보통의 웹 앱에서는 `dest` 옵션 정도만 필요할지도 모릅니다. 설정 방법은 아래의 예제에 나와있습니다.

```javascript
const upload = multer({ dest: 'uploads/' })
```

만일 업로드를 더 제어하고 싶다면, `dest` 옵션 대신 `storage` 옵션을 사용할 수 있습니다. Multer는 스토리지 엔진인 `DiskStorage` 와 `MemoryStorage` 를 탑재하고 있습니다. 써드파티로부터 더 많은 엔진들을 사용할 수 있습니다.

#### `.single(fieldname)`

`fieldname` 인자에 명시된 이름의 단수 파일을 전달 받습니다. 이 파일은 `req.file` 에 저장될 것 입니다.

#### `.array(fieldname[, maxCount])`

`fieldname` 인자에 명시된 이름의 파일 전부를 배열 형태로 전달 받습니다. 선택적으로 `maxCount` 에 명시된 값 이상의 파일이 업로드 될 경우 에러를 출력할 수 있습니다. 전달 된 배열 형태의 파일은 `req.files` 에 저장될 것입니다.

#### `.fields(fields)`

`fields` 인자에 명시된 여러 파일을 전달 받습니다. 파일 객체는 배열 형태로 `req.files` 에 저장될 것입니다.

`fields` 는 `name` 과 `maxCount` (선택사항) 을 포함하는 객체의 배열이어야 합니다.
예제:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

오직 텍스트 필드만 허용합니다. 만일 파일이 업로드 되었을 경우, "LIMIT\_UNEXPECTED\_FILE" 와 같은 에러 코드가 발생할 것입니다. 이는 `upload.fields([])` 와 같은 동작을 합니다.

#### `.any()`

전달된 모든 파일을 허용합니다. 파일 배열은 `req.files` 에 저장될 것입니다.

**주의:** 항상 사용자가 업로드한 파일을 다룬다는 점을 명심하세요. 악의적인 사용자가 여러분이 예측하지 못한 곳으로 파일을 업로드 할 수 있으므로 절대 multer를 글로벌 미들웨어로 사용하지 마세요.

### `storage`

#### `DiskStorage`

디스크 스토리지 엔진은 파일을 디스크에 저장하기 위한 모든 제어 기능을 제공합니다.

```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

const upload = multer({ storage: storage })
```

`destination` 과 `filename` 의 두가지 옵션이 가능합니다. 두 옵션 모두 파일을 어디에 저장할 지를 정하는 함수입니다.

`destination` 옵션은 어느 폴더안에 업로드 한 파일을 저장할 지를 결정합니다. 이는 `string` 형태로 주어질 수 있습니다 (예. `'/tmp/uploads'`). 만일 `destination` 옵션이 주어지지 않으면, 운영체제 시스템에서 임시 파일을 저장하는 기본 디렉토리를 사용합니다.

**주:** `destination` 을 함수로 사용할 경우, 디렉토리를 생성해야 할 책임이 있습니다. 문자열이 전달될 때, multer는 해당 디렉토리가 생성되었는지 확인합니다.

`filename` 은 폴더안에 저장되는 파일 명을 결정하는데 사용됩니다.
만일 `filename` 이 주어지지 않는다면, 각각의 파일은 파일 확장자를 제외한 랜덤한 이름으로 지어질 것입니다.

**주:** Multer는 어떠한 파일 확장자도 추가하지 않습니다. 사용자 함수는 파일 확장자를 온전히 포함한 파일명을 반환해야 합니다.

결정을 돕기 위해 각각의 함수는 요청 정보 (`req`) 와 파일 (`file`) 에 대한 정보를 모두 전달 받습니다.

`req.body` 는 완전히 채워지지 않았을 수도 있습니다. 이는 클라이언트가 필드와 파일을 서버로 전송하는 순서에 따라 다릅니다.

#### `MemoryStorage`

메모리 스토리지 엔진은 파일을 메모리에 `Buffer` 객체로 저장합니다. 이에 대해서는 어떤 옵션도 없습니다.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

메모리 스토리지 사용시, 파일 정보는 파일 전체를 포함하는 `buffer` 라고 불리는 필드를 포함할 것입니다.

**주의**: 메모리 스토리지를 사용시, 매우 큰 사이즈의 파일을 업로드 하거나 많은 양의 비교적 작은 파일들을 매우 빠르게 업로드 하는 경우 응용 프로그램의 메모리 부족이 발생 할 수 있습니다.

### `limits`

다음의 선택적 속성의 크기 제한을 지정하는 객체입니다. Multer 는 이 객체를 busboy로 직접 전달합니다. 속성들에 대한 자세한 내용은 [busboy's page](https://github.com/mscdex/busboy#busboy-methods) 에서 확인 하실 수 있습니다.

다음과 같은 정수 값들이 가능합니다:

속성 | 설명 | 기본값
--- | --- | ---
`fieldNameSize` | 필드명 사이즈 최대값 | 100 bytes
`fieldSize` | 필드값 사이즈 최대값 | 1MB
`fields` | 파일형식이 아닌 필드의 최대 개수 | 무제한
`fileSize` | multipart 형식 폼에서 최대 파일 사이즈(bytes) | 무제한
`files` | multipart 형식 폼에서 파일 필드의 최대 개수 | 무제한
`parts` | For multipart forms, the max number of parts (fields + files) | 무제한
`headerPairs` | multipart 형식 폼에서 파싱할 헤더의 key=>value 쌍의 최대 개수| 2000

사이즈 제한을 지정하면 서비스 거부 (DoS) 공격으로부터 사이트를 보호하는데 도움이 됩니다.

### `fileFilter`

어느 파일을 업로드 할지, 혹은 건너뛸지 제어할 수 있게 함수에 설정합니다. 해당 함수는 아래와 같을 것입니다 :

```javascript
function fileFilter (req, file, cb) {

  // 이 함수는 boolean 값과 함께 `cb`를 호출함으로써 해당 파일을 업로드 할지 여부를 나타낼 수 있습니다.
  // 이 파일을 거부하려면 다음과 같이 `false` 를 전달합니다:
  cb(null, false)

  // 이 파일을 허용하려면 다음과 같이 `true` 를 전달합니다:
  cb(null, true)

  // 무언가 문제가 생겼다면 언제나 에러를 전달할 수 있습니다:
  cb(new Error('I don\'t have a clue!'))

}
```

## 에러 핸들링

에러가 발생할 때, multer는 에러를 express에 위임할 것입니다. 여러분은 [the standard express way](http://expressjs.com/guide/error-handling.html) 를 이용해서 멋진 오류 페이지를 보여줄 수 있습니다.

만일 multer 로부터 특별히 에러를 캐치하고 싶다면, 직접 미들웨어 함수를 호출하세요.

```javascript
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      // 업로드할때 오류가 발생함
      return
    }

    // 정상적으로 완료됨
  })
})
```

## 커스텀 스토리지 엔진

자신만의 고유한 스토리지 엔진을 구축하기 위한 정보를 얻기 위해서는 [Multer Storage Engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md) 문서를 참고하세요.

## 라이센스

[MIT](LICENSE)
