# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer 是一个用于处理 `multipart/form-data` 的 node.js 中间件，主要用于上传文件。它基于
[busboy](https://github.com/mscdex/busboy) 编写，以获得最高的效率。

**注意**：Multer 不会处理任何非 multipart（`multipart/form-data`）类型的表单。

## 其它语言

本 README 也提供以下语言的版本：

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | 英语            |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | 阿拉伯语        |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | 法语            |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | 日语            |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | 印度尼西亚语 |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | 韩语            |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | 葡萄牙语（巴西） |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | 俄语            |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | 西班牙语        |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | 泰米尔语        |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | 乌兹别克语      |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | 越南语          |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | 土耳其语        |


## 安装

```sh
$ npm install multer
```

## 使用

Multer 会向 `request` 对象添加一个 `body` 对象以及一个 `file` 或 `files` 对象。`body` 对象包含表单文本域的值，`file` 或 `files` 对象包含通过表单上传的文件。

基本用法示例：

别忘了在你的表单中加上 `enctype="multipart/form-data"`。

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
  // req.file 是 `avatar` 文件
  // req.body 将保存文本域（如果有的话）
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files 是 `photos` 文件的数组
  // req.body 将包含文本域（如果有的话）
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files 是一个对象（String -> Array），以 fieldname 为键，值为文件数组
  //
  // 例如
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body 将包含文本域（如果有的话）
})
```

如果你需要处理一个只包含文本域的 multipart 表单，应当使用 `.none()` 方法：

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body 包含文本域
})
```

下面是一个在 HTML 表单中使用 multer 的示例。请特别留意 `enctype="multipart/form-data"` 和 `name="uploaded_file"` 这两个字段：

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

然后在你的 javascript 文件中添加以下几行代码，即可同时访问文件和请求体。关键在于，你在上传函数中使用的必须是表单里 `name` 字段的值。它告诉 multer 应当在请求的哪个字段中查找文件。如果 HTML 表单与服务器端的这些字段不一致，上传就会失败：

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file 是你在上面表单中的文件名，这里为 'uploaded_file'
  // req.body 将保存文本域（如果有的话）
  console.log(req.file, req.body)
});
```



## API

### 文件信息

每个文件包含以下信息：

Key | 描述 | 备注
--- | --- | ---
`fieldname` | 表单中指定的字段名 |
`originalname` | 文件在用户计算机上的名称；当 `preservePath: true` 时为完整路径 |
`encoding` | 文件的编码类型 |
`mimetype` | 文件的 MIME 类型 |
`size` | 文件大小（字节） |
`destination` | 文件所保存到的文件夹 | `DiskStorage`
`filename` | 文件在 `destination` 中的名称 | `DiskStorage`
`path` | 已上传文件的完整路径 | `DiskStorage`
`buffer` | 包含整个文件的 `Buffer` | `MemoryStorage`

### `multer(opts)`

Multer 接受一个 options 对象，其中最基本的是 `dest`
属性，它告诉 Multer 把文件上传到哪里。如果你省略了
options 对象，文件将只保留在内存中，永远不会写入磁盘。

默认情况下，Multer 会重命名文件以避免命名冲突。
重命名函数可以根据你的需要自定义。

以下是可以传递给 Multer 的选项。

Key | 描述
--- | ---
`dest` 或 `storage` | 文件存储的位置
`fileFilter` | 用于控制接受哪些文件的函数
`limits` | 对上传数据的限制
`preservePath` | 在 `file.originalname` 中保留客户端提供的完整路径，而不只是基础文件名
`defParamCharset` | 用于 part 头部参数值（例如 filename）的默认字符集，仅适用于非扩展参数（即不包含显式字符集的参数）。默认值：`'latin1'`

在一般的 Web 应用中，可能只需要设置 `dest`，其配置方式如下例所示。

```javascript
const upload = multer({ dest: 'uploads/' })
```

启用 `preservePath` 后，Multer 会原样传递传入的文件名，
并保留客户端提供的所有路径片段。它通过 `file.originalname` 暴露出来；
它不会改变目标文件夹、创建目录，也不会为你清理路径。
`file.originalname` 始终由客户端提供，应当视为不可信；
启用 `preservePath` 后，它还会额外包含客户端发送的路径片段。
在自定义的 `filename` 或存储引擎中使用它之前，请先对其进行规范化或校验。

如果你希望对上传过程有更多的控制，应当使用 `storage`
选项来代替 `dest`。Multer 自带 `DiskStorage`
和 `MemoryStorage` 两个存储引擎；还可以从第三方获得更多引擎。

#### `.single(fieldname)`

接受一个名为 `fieldname` 的单个文件。该文件将保存在
`req.file` 中。

#### `.array(fieldname[, maxCount])`

接受一个文件数组，所有文件的名称都为 `fieldname`。可选地，当上传的文件数
超过 `maxCount` 时报错。文件数组将保存在
`req.files` 中。

#### `.fields(fields)`

接受由 `fields` 指定的多种文件的组合。一个由文件数组组成的对象
将保存在 `req.files` 中。

`fields` 应当是一个对象数组，每个对象包含 `name` 以及可选的 `maxCount`。
示例：

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

只接受文本域。如果有任何文件上传，将会抛出代码为
"LIMIT\_UNEXPECTED\_FILE" 的错误。

#### `.any()`

接受通过网络传来的所有文件。文件数组将保存在
`req.files` 中。

**警告：** 请确保你始终对用户上传的文件进行处理。
永远不要把 multer 作为全局中间件添加，因为恶意用户可能会向
你未曾预料的路由上传文件。只在你处理上传文件的路由上
使用此函数。

### `storage`

#### `DiskStorage`

磁盘存储引擎让你可以完全控制文件在磁盘上的存储方式。

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

有两个可用的选项：`destination` 和 `filename`。它们都是
用于决定文件存储位置的函数。

`destination` 用于决定上传的文件应当存储在哪个文件夹中。
它也可以以 `string` 的形式给出（例如 `'/tmp/uploads'`）。如果没有提供
`destination`，则使用操作系统默认的临时文件目录。

**注意：** 当以函数形式提供 `destination` 时，你需要自行负责
创建该目录。当传入字符串时，multer 会确保为你
创建好该目录。

`filename` 用于决定文件在该文件夹中的名称。
如果没有提供 `filename`，每个文件都会得到一个不带任何
文件扩展名的随机名称。

**注意：** Multer 不会为你添加任何文件扩展名，你的函数
应当返回一个带有文件扩展名的完整文件名。

每个函数都会接收到请求对象（`req`）以及关于该文件的一些信息（`file`），
以帮助你做出决定。

注意，`req.body` 此时可能尚未被完全填充。这取决于
客户端向服务器传输字段和文件的顺序。

若要了解回调中使用的调用约定（需要将
null 作为第一个参数传入），请参阅
[Node.js 错误处理](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

内存存储引擎将文件以 `Buffer` 对象的形式存储在内存中。它
没有任何选项。

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

使用内存存储时，文件信息中会包含一个名为
`buffer` 的字段，其中存放着整个文件。

**警告**：使用内存存储时，上传非常大的文件，或者在短时间内
快速上传大量相对较小的文件，都可能导致你的应用程序
内存耗尽。

### `limits`

一个对象，用于指定下列可选属性的大小限制。Multer 会将该对象直接传递给 busboy，各属性的详细说明可在 [busboy 的页面](https://github.com/mscdex/busboy#exports)中找到。

可用的整数值如下：

Key | 描述 | 默认值
--- | --- | ---
`fieldNameSize` | 字段名的最大长度 | Infinity
`fieldSize` | 字段值的最大长度（字节） | 1MB
`fields` | 非文件字段的最大数量 | Infinity
`fileSize` | 对于 multipart 表单，文件的最大大小（字节） | Infinity
`files` | 对于 multipart 表单，文件字段的最大数量 | Infinity
`parts` | 对于 multipart 表单，part 的最大数量（字段 + 文件） | Infinity
`headerPairs` | 对于 multipart 表单，要解析的头部键值对（key=>value）的最大数量 | 2000
`fieldNestingDepth` | 字段名的最大嵌套层数（例如 `a[b][c]` 有 2 层） | Infinity
`fieldArrayIndexLimit` | 字段名中可接受的最大数字数组索引（例如 `a[3]` 使用索引 3） | Infinity

`parts` 限制会在 busboy 达到所配置的 part 数量时触发，
而不是仅在超过该数量之后才触发。如果你想允许恰好某个数量的
字段和文件，请将 `parts` 设置为至少比该总数大 1。

指定这些限制可以帮助保护你的站点抵御拒绝服务（DoS）攻击。

### `fileFilter`

将其设置为一个函数，用于控制哪些文件应当上传、哪些
应当跳过。该函数应当如下所示：

```javascript
function fileFilter (req, file, cb) {

  // 该函数应当以一个布尔值调用 `cb`
  // 用来指示是否应接受该文件

  // 要拒绝该文件，请传入 `false`，像这样：
  cb(null, false)

  // 要接受该文件，请传入 `true`，像这样：
  cb(null, true)

  // 如果出了问题，你也可以随时传入一个错误：
  cb(new Error('I don\'t have a clue!'))

}
```

## 安全

指定 [limits](#limits) 可以帮助保护你的站点抵御拒绝服务（DoS）攻击。对于大多数应用，建议设置以下限制：

- `fileSize` -- 设置为你的使用场景中预期的最大文件大小
- `files` -- 设置为每个请求的最大文件数
- `fields` -- 设置为每个请求的最大文本字段数
- `fieldNestingDepth` -- 设置为你的字段名所需的最小嵌套深度（例如 `a[b][c]` 对应 `3`）
- `fieldArrayIndexLimit` -- 设置为你的字段名所需的最大数组索引（例如 `a[99]` 对应 `100`）

## 错误处理

遇到错误时，Multer 会把错误交给 Express 处理。你可以
按照 [express 的标准方式](https://expressjs.com/en/guide/error-handling/)展示一个友好的错误页面。

如果你想专门捕获来自 Multer 的错误，可以自行
调用中间件函数。此外，如果你只想捕获 [Multer 的错误](https://github.com/expressjs/multer/blob/main/lib/multer-error.js)，可以使用挂载在 `multer` 对象自身上的 `MulterError` 类（例如 `err instanceof multer.MulterError`）。

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // 上传时发生了 Multer 错误。
    } else if (err) {
      // 上传时发生了未知错误。
    }

    // 一切正常。
  })
})
```

## 自定义存储引擎

关于如何构建你自己的存储引擎，请参阅 [Multer 存储引擎](https://github.com/expressjs/multer/blob/main/StorageEngine.md)。

## 许可证

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
