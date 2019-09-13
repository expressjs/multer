# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer 是一個 node.js 中介軟體，用於處理 `multipart/form-data` 這類型的表單資料，它主要用於檔案上傳。它是基於 [busboy](https://github.com/mscdex/busboy) 之上非常高效能。

**注意**: Multer 不會處理任何非 `multipart/form-data` 類型的表單資料。

## 其它語言

- [English](https://github.com/expressjs/multer/blob/master/README.md) (英語)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (韓語)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (俄語)

## 安装

```sh
$ npm install --save multer
```

## 使用

Multer 會加入一個 `body` 物件 以及 `file` 或 `files` 物件 到 express 的 `request` 物件中。
`body` 物件包含表單的文字資料的訊息，`file` 或 `files`  物件包含表單上傳的文件訊息。

基本使用方法:

別忘了加上 `enctype="multipart/form-data"` 在表單中.

```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" />
</form>
```

```javascript
var express = require('express')
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var app = express()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file 是 `avatar` 文件資訊
  // req.body 將具有文字資料的訊息，如果存在的話
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files 是 `photos` 文件陣列的資訊
  // req.body 將具有文字資料的訊息，如果存在的話
})

var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files 是一個物件 (String -> Array) 鍵是文件名，值是文件陣列
  //
  // 例如：
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body 將具有文字資料的訊息，如果存在的話
})
```

如果你需要處理一個純文字資料的表單，你應該使用 `.none()`:

```javascript
var express = require('express')
var app = express()
var multer  = require('multer')
var upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body 文字資料
})
```

## API

### 文件訊息

每個文件都具有下面這些的訊息:

Key | Description | Note
--- | --- | ---
`fieldname` | Field name 由表單所設定 |
`originalname` | 用戶端上的文件的檔案名稱 |
`encoding` | 文件編碼 |
`mimetype` | 文件的 MIME 類型 |
`size` | 文件大小（bytes） |
`destination` | 儲存路徑 | `DiskStorage`
`filename` | 儲存在 `destination` 中的檔案名稱 | `DiskStorage`
`path` | 已上傳文件的完整路徑 | `DiskStorage`
`buffer` | 一個儲存了整個文件的 `Buffer`  | `MemoryStorage`

### `multer(opts)`

Multer 接受一個 options 物件，其中最基本的是 `dest` 屬性，這將告訴 Multer 將上傳文件儲存在哪。如果你省略 options 物件，這些文件將儲存在記憶體中，永遠不會儲存到硬碟中。

為了避免命名衝突，Multer 會修改上傳的文件檔名。這個重新命名的功能可以依據您的需要設定。

以下是可以傳入给 Multer 的選項。

Key | Description
--- | ---
`dest` or `storage` | 在哪裡儲存文件
`fileFilter` | 文件過濾器，設定哪些文件類型允許上傳
`limits` | 限制上傳的文件的大小
`preservePath` | 保存包含文件名的完整文件路径

通常，在一般的網頁應用中，只需要設定 `dest` 屬性，像這樣：

```javascript
var upload = multer({ dest: 'uploads/' })
```

如果你想在上傳時進行更多的設定，你可以使用 `storage` 選項替代 `dest`。Multer 具有 `DiskStorage` 和 `MemoryStorage` 這兩個儲存引擎；另外還可以使用更多的第三方儲存引擎。

#### `.single(fieldname)`

接受一個以 `fieldname` 命名的文件。這個文件的資訊儲存在 `req.file`。

#### `.array(fieldname[, maxCount])`

接受一個以 `fieldname` 命名的文件陣列。可以設定 `maxCount` 來限制上傳的最大數量。這些文件的資訊保存在 `req.files`。

#### `.fields(fields)`

接受指定 `fields` 的混合文件。這些文件的資訊保存在 `req.files`。

`fields` 應該是一個物件陣列，應該具有 `name` 和可選的 `maxCount` 屬性。

Example:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

只接受文字資料。如果任何文件上傳到這個模式，將發生 "LIMIT\_UNEXPECTED\_FILE" 錯誤。

#### `.any()`

接受所有上傳的文件。文件陣列將儲存在 `req.files`。

**警告:** 確保你總是處理了使用者的文件上傳。
永遠不要將 multer 作為全域的中介來使用，因為惡意的使用者可以上傳文件到一個你没有預料到的路由中，應該只在你需要處理上傳文件的路由上使用。

### `storage`

#### 硬碟儲存引擎 (`DiskStorage`)

硬碟儲存引擎可以讓你設定文件的儲存。

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

有兩個選項可用，`destination` 和 `filename`。他們都是用來設定文件儲存位置的函式。

`destination` 是用來設定上傳的文件應該儲存在哪個目錄中。也可以提供一個 `string` (例如 `'/tmp/uploads'`)。如果没有設定 `destination`，則使用作業系統中預設的暫存目錄。

**注意:** 如果你提供的 `destination` 是一個函式，你必需先建立好目錄。當目錄 string 傳入 multer，multer 將確保這個目錄是已建立的。

`filename` 用於設定目錄中的文件的檔案名稱。 如果没有設定 `filename`，每個文件將隨機設定成一個名稱，而且是不包含副檔名的。

**注意:** Multer 不會自動加上附檔名，你的函式應該返回一個完整包含副檔名的檔案名稱。

每個函式都傳入了 request 物件 (`req`) 和相關的文件資訊 (`file`)，讓你來決定。

注意 `req.body` 可能還沒有完全賦值，這取決於客戶端傳送欄位和文件到伺服器的順序。

#### 記憶體儲存引擎 (`MemoryStorage`)

記憶體儲存引擎將文件儲存在記憶體中的 `Buffer` 物件，它没有任何的參數選項。

```javascript
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
```

當使用記憶體儲存引擎，文件資訊將包含一個 `buffer` 欄位，裡面包含了整個文件資訊。

**警告**: 当你使用記憶體儲存，上傳非常大的文件，或是非常多的小文件，有可能會導致你的應用程式因記憶體用盡，而發生錯誤。

### `limits`
一個物件，指定一些文件大小的限制。Multer 透過這個物件使用 busboy，詳細的屬性可以在 [busboy's page](https://github.com/mscdex/busboy#busboy-methods) 查詢。

可以使用下面這些參數:

Key | Description | Default
--- | --- | ---
`fieldNameSize` | field name 最大容量 | 100 bytes
`fieldSize` | field 值的最大容量  | 1MB
`fields` | 非文件 field 的最大數量 | 無限
`fileSize` | 在 multipart 表單中，文件最大容量 (單位 bytes) | 無限
`files` | 在 multipart 表單中，文件最大數量 | 無限
`parts` | 在 multipart 表單中，part 的最大數量(fields + files) | 無限
`headerPairs` | 在 multipart 表單中，鍵值對的最大筆數 | 2000

設定 limits 可以保護你的網站抵抗阻斷服務 (DoS) 攻擊。

### `fileFilter`
設定一個函式來設定什麼類型的文件可以上傳以及什麼類型的文件應該跳過，這個函式應該看起來像這樣：

```javascript
function fileFilter (req, file, cb) {

  // 這個函式應該執行 `cb` 用boolean值來
  // 指示是否允許接收該文件

  // 拒絕這個文件，使用`false`，像這樣:
  cb(null, false)

  // 允許這個文件，使用`true`，像這樣:
  cb(null, true)

  // 如果有問題，你可以這樣發出一個錯誤:
  cb(new Error('I don\'t have a clue!'))

}
```

## 錯誤處理

當遇到一個錯誤，multer 將會把錯誤指派给 express。你可以使用一個比較好的錯誤提示頁 ([express標準方式](http://expressjs.com/guide/error-handling.html))。

如果你想捕捉 multer 發出的錯誤，你可以自己執行中介軟體。如果你想捕捉 [Multer 錯誤](https://github.com/expressjs/multer/blob/master/lib/multer-error.js)，你可以使用 `multer` 物件下的 `MulterError` 類別 (即 `err instanceof multer.MulterError`)。

```javascript
var multer = require('multer')
var upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer 在上傳時發生錯誤
    } else if (err) {
      // 未知的錯誤在上傳時發生
    }

    // 正常
  })
})
```

## 自訂儲存引擎

如果你想要設定自己的儲存引擎，請看 [Multer Storage Engine](/StorageEngine.md) 。

## License

[MIT](LICENSE)
