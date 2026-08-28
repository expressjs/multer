# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer는 주로 파일 업로드에 사용되는 `multipart/form-data`를 처리하기 위한 node.js 미들웨어입니다. 효율성을 최대화하기 위해
[busboy](https://github.com/mscdex/busboy)를 기반으로 작성되었습니다.

**주의**: Multer는 multipart(`multipart/form-data`)가 아닌 폼은 처리하지 않습니다.

## 번역

이 README는 다른 언어로도 제공됩니다:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)            | 영어            |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | 아랍어          |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | 중국어(간체)    |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | 프랑스어        |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | 일본어          |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | 인도네시아어 |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | 포르투갈어(브라질) |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | 러시아어        |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | 스페인어        |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | 타밀어          |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | 우즈베크어      |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | 베트남어        |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | 터키어          |


## 설치

```sh
$ npm install multer
```

## 사용법

Multer는 `request` 객체에 `body` 객체와 `file` 또는 `files` 객체를 추가합니다. `body` 객체에는 폼의 텍스트 필드 값이 담기고, `file` 또는 `files` 객체에는 폼을 통해 업로드된 파일이 담깁니다.

기본 사용 예제:

폼에 `enctype="multipart/form-data"`를 빠뜨리지 마세요.

```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" />
</form>
```

```javascript
const express = require('express')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const app = express()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file은 `avatar` 파일입니다
  // 텍스트 필드가 있었다면 req.body에 담깁니다
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files는 `photos` 파일의 배열입니다
  // 텍스트 필드가 있었다면 req.body에 담깁니다
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files는 fieldname이 키이고 값이 파일 배열인 객체(String -> Array)입니다
  //
  // 예:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // 텍스트 필드가 있었다면 req.body에 담깁니다
})
```

텍스트 전용 multipart 폼을 처리해야 하는 경우에는 `.none()` 메서드를 사용해야 합니다:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body에 텍스트 필드가 담깁니다
})
```

다음은 HTML 폼에서 multer를 사용하는 방법에 대한 예제입니다. `enctype="multipart/form-data"`와 `name="uploaded_file"` 필드를 특히 눈여겨보세요:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

그런 다음 javascript 파일에 아래 줄들을 추가하면 파일과 body에 모두 접근할 수 있습니다. 업로드 함수에는 반드시 폼의 `name` 필드 값을 사용해야 합니다. 이 값은 요청의 어느 필드에서 파일을 찾아야 하는지 multer에 알려줍니다. HTML 폼과 서버에서 이 필드가 서로 다르면 업로드는 실패합니다:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file은 위 폼에 있는 파일의 이름이며, 여기서는 'uploaded_file'입니다
  // 텍스트 필드가 있었다면 req.body에 담깁니다
  console.log(req.file, req.body)
});
```



## API

### 파일 정보

각 파일은 다음 정보를 포함합니다:

Key | Description | Note
--- | --- | ---
`fieldname` | 폼에 지정된 필드명 |
`originalname` | 사용자 컴퓨터에 있던 파일명. `preservePath: true`인 경우에는 전체 경로 |
`encoding` | 파일의 인코딩 타입 |
`mimetype` | 파일의 Mime 타입 |
`size` | 파일 크기(바이트) |
`destination` | 파일이 저장된 폴더 | `DiskStorage`
`filename` | `destination` 안에 저장된 파일명 | `DiskStorage`
`path` | 업로드된 파일의 전체 경로 | `DiskStorage`
`buffer` | 파일 전체를 담은 `Buffer` | `MemoryStorage`

### `multer(opts)`

Multer는 옵션 객체를 받습니다. 그중 가장 기본적인 것은 `dest`
속성으로, Multer에 파일을 어디에 업로드할지 알려줍니다. 옵션 객체를
생략하면 파일은 메모리에만 보관되며 디스크에는 절대 기록되지 않습니다.

기본적으로 Multer는 이름 충돌을 피하기 위해 파일 이름을 바꿉니다. 이름을
바꾸는 함수는 필요에 따라 커스터마이징할 수 있습니다.

Multer에 전달할 수 있는 옵션은 다음과 같습니다.

Key | Description
--- | ---
`dest` or `storage` | 파일을 저장할 위치
`fileFilter` | 어떤 파일을 허용할지 제어하는 함수
`limits` | 업로드되는 데이터의 제한
`preservePath` | `file.originalname`에 base name만이 아니라 클라이언트가 전달한 전체 경로를 유지
`defParamCharset` | 확장 매개변수(명시적 charset을 포함하는 매개변수)가 아닌 part 헤더 매개변수 값(예: filename)에 사용할 기본 문자 집합. 기본값: `'latin1'`

일반적인 웹 앱에서는 `dest`만 필요할 수도 있으며, 다음 예제와 같이
설정합니다.

```javascript
const upload = multer({ dest: 'uploads/' })
```

`preservePath`를 활성화하면 Multer는 클라이언트가 제공한 경로 세그먼트를
포함한 파일명을 그대로 전달합니다. 이 값은 `file.originalname`으로 노출되며,
저장 폴더를 바꾸거나 디렉토리를 생성하거나 경로를 대신 정리(sanitize)해 주지는
않습니다. `file.originalname`은 항상 클라이언트가 제공한 값이므로 신뢰할 수
없는 값으로 취급해야 하며, `preservePath`를 사용하면 클라이언트가 보낸 경로
세그먼트까지 추가로 포함됩니다. 커스텀 `filename`이나 스토리지 엔진에서 사용하기
전에 정규화하거나 검증하세요.

업로드를 더 세밀하게 제어하고 싶다면 `dest` 대신 `storage` 옵션을
사용하세요. Multer는 `DiskStorage`와 `MemoryStorage` 스토리지 엔진을
기본으로 제공하며, 서드파티에서 더 많은 엔진을 사용할 수 있습니다.

#### `.single(fieldname)`

`fieldname`이라는 이름의 단일 파일을 받습니다. 이 파일은 `req.file`에
저장됩니다.

#### `.array(fieldname[, maxCount])`

모두 `fieldname`이라는 이름을 가진 파일의 배열을 받습니다. 선택적으로
`maxCount`개보다 많은 파일이 업로드되면 에러를 발생시킬 수 있습니다. 파일 배열은
`req.files`에 저장됩니다.

#### `.fields(fields)`

`fields`로 지정한 여러 종류의 파일을 받습니다. 파일 배열을 담은 객체가
`req.files`에 저장됩니다.

`fields`는 `name`과 선택적으로 `maxCount`를 가진 객체의 배열이어야 합니다.
예제:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

텍스트 필드만 받습니다. 파일 업로드가 있으면
"LIMIT\_UNEXPECTED\_FILE" 코드의 에러가 발생합니다.

#### `.any()`

전송되는 모든 파일을 받습니다. 파일 배열은
`req.files`에 저장됩니다.

**경고:** 사용자가 업로드한 파일은 항상 처리해야 합니다.
악의적인 사용자가 예상하지 못한 라우트에 파일을 업로드할 수 있으므로
multer를 전역 미들웨어로 추가해서는 절대 안 됩니다. 이 함수는 업로드된 파일을
처리하는 라우트에서만 사용하세요.

### `storage`

#### `DiskStorage`

디스크 스토리지 엔진은 파일을 디스크에 저장하는 과정을 완전히 제어할 수 있게 해줍니다.

```javascript
const crypto = require('crypto')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err)
      cb(null, file.fieldname + '-' + raw.toString('hex'))
    })
  }
})

const upload = multer({ storage: storage })
```

`destination`과 `filename` 두 가지 옵션을 사용할 수 있습니다. 둘 다
파일을 어디에 저장할지 결정하는 함수입니다.

`destination`은 업로드된 파일을 어느 폴더에 저장할지 결정하는 데
사용됩니다. `string`으로 지정할 수도 있습니다(예: `'/tmp/uploads'`).
`destination`이 주어지지 않으면 운영체제의 기본 임시 파일 디렉토리가
사용됩니다.

**참고:** `destination`을 함수로 제공하는 경우 디렉토리 생성은 여러분의
책임입니다. 문자열을 전달하면 multer가 디렉토리가 생성되어 있는지
확인해 줍니다.

`filename`은 폴더 안에서 파일의 이름을 무엇으로 할지 결정하는 데 사용됩니다.
`filename`이 주어지지 않으면 각 파일에는 파일 확장자가 없는 임의의 이름이
부여됩니다.

**참고:** Multer는 파일 확장자를 붙여 주지 않으므로, 여러분의 함수가
파일 확장자를 포함한 완전한 파일명을 반환해야 합니다.

각 함수에는 결정에 도움이 되도록 요청(`req`)과 파일에 대한 정보(`file`)가
모두 전달됩니다.

`req.body`는 아직 완전히 채워지지 않았을 수 있다는 점에 유의하세요. 이는
클라이언트가 필드와 파일을 서버로 전송하는 순서에 따라 달라집니다.

콜백에서 사용되는 호출 규약(첫 번째 인자로 null을 전달해야 하는 것)을
이해하려면
[Node.js error handling](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)을 참고하세요.

#### `MemoryStorage`

메모리 스토리지 엔진은 파일을 `Buffer` 객체로 메모리에 저장합니다.
옵션은 없습니다.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

메모리 스토리지를 사용하면 파일 정보에 파일 전체를 담고 있는
`buffer`라는 필드가 포함됩니다.

**경고**: 메모리 스토리지를 사용할 때 매우 큰 파일을 업로드하거나, 비교적 작은
파일을 대량으로 매우 빠르게 업로드하면 애플리케이션의 메모리가
부족해질 수 있습니다.

### `limits`

다음 선택적 속성들의 크기 제한을 지정하는 객체입니다. Multer는 이 객체를 busboy에 그대로 전달하며, 각 속성에 대한 자세한 내용은 [busboy 페이지](https://github.com/mscdex/busboy#exports)에서 확인할 수 있습니다.

다음 정수 값을 사용할 수 있습니다:

Key | Description | Default
--- | --- | ---
`fieldNameSize` | 필드명의 최대 크기 | Infinity
`fieldSize` | 필드 값의 최대 크기(바이트) | 1MB
`fields` | 파일이 아닌 필드의 최대 개수 | Infinity
`fileSize` | multipart 폼에서 파일의 최대 크기(바이트) | Infinity
`files` | multipart 폼에서 파일 필드의 최대 개수 | Infinity
`parts` | multipart 폼에서 part(필드 + 파일)의 최대 개수 | Infinity
`headerPairs` | multipart 폼에서 파싱할 헤더 key=>value 쌍의 최대 개수 | 2000
`fieldNestingDepth` | 필드명의 최대 중첩 단계 수(예: `a[b][c]`는 2단계) | Infinity
`fieldArrayIndexLimit` | 필드명 안에서 허용되는 최대 숫자 배열 인덱스(예: `a[3]`은 인덱스 3 사용) | Infinity

`parts` 제한은 busboy가 설정된 개수의 part에 도달하는 순간 발동하며,
그 개수를 초과한 뒤에만 발동하는 것이 아닙니다. 정확히 정해진 개수의 필드와
파일을 허용하고 싶다면 `parts`를 그 합계보다 최소 1 이상 크게 설정하세요.

제한을 지정하면 서비스 거부(DoS) 공격으로부터 사이트를 보호하는 데 도움이 됩니다.

### `fileFilter`

어떤 파일을 업로드하고 어떤 파일을 건너뛸지 제어하는 함수로 설정합니다.
함수는 다음과 같은 형태여야 합니다:

```javascript
function fileFilter (req, file, cb) {

  // 이 함수는 파일을 허용할지 여부를 나타내는
  // boolean 값과 함께 `cb`를 호출해야 합니다

  // 이 파일을 거부하려면 다음과 같이 `false`를 전달합니다:
  cb(null, false)

  // 이 파일을 허용하려면 다음과 같이 `true`를 전달합니다:
  cb(null, true)

  // 문제가 생겼다면 언제든지 에러를 전달할 수 있습니다:
  cb(new Error('I don\'t have a clue!'))

}
```

## 보안

[limits](#limits)를 지정하면 서비스 거부(DoS) 공격으로부터 사이트를 보호하는 데 도움이 됩니다. 대부분의 애플리케이션에는 다음 제한을 권장합니다:

- `fileSize` -- 사용 사례에서 예상되는 최대 파일 크기로 설정
- `files` -- 요청당 최대 파일 개수로 설정
- `fields` -- 요청당 최대 텍스트 필드 개수로 설정
- `fieldNestingDepth` -- 필드명에 필요한 최소 깊이로 설정(예: `a[b][c]`의 경우 `3`)
- `fieldArrayIndexLimit` -- 필드명에 필요한 가장 큰 배열 인덱스로 설정(예: `a[99]`의 경우 `100`)

## 에러 처리

에러가 발생하면 Multer는 에러를 Express에 위임합니다.
[express의 표준 방식](https://expressjs.com/en/guide/error-handling/)을 사용해 보기 좋은 에러 페이지를 표시할 수 있습니다.

Multer에서 발생한 에러만 따로 잡고 싶다면 미들웨어 함수를 직접
호출하면 됩니다. 또한 [Multer 에러](https://github.com/expressjs/multer/blob/main/lib/multer-error.js)만 잡고 싶다면 `multer` 객체 자체에 붙어 있는 `MulterError` 클래스를 사용할 수 있습니다(예: `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // 업로드 중 Multer 에러가 발생했습니다.
    } else if (err) {
      // 업로드 중 알 수 없는 에러가 발생했습니다.
    }

    // 모든 것이 정상적으로 완료되었습니다.
  })
})
```

## 커스텀 스토리지 엔진

자신만의 스토리지 엔진을 만드는 방법에 대한 정보는 [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md)을 참고하세요.

## 라이선스

[MIT](LICENSE)

[ci-image]: https://github.com/expressjs/multer/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/expressjs/multer/actions/workflows/ci.yml
[test-url]: https://coveralls.io/r/expressjs/multer?branch=main
[test-image]: https://badgen.net/coveralls/c/github/expressjs/multer/main
[npm-downloads-image]: https://badgen.net/npm/dm/multer
[npm-url]: https://npmjs.org/package/multer
[npm-version-image]: https://badgen.net/npm/v/multer
[ossf-scorecard-badge]: https://api.scorecard.dev/projects/github.com/expressjs/multer/badge
[ossf-scorecard-visualizer]: https://ossf.github.io/scorecard-visualizer/#/projects/github.com/expressjs/multer
