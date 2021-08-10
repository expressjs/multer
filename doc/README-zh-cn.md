**此文档于2021年4月2日翻译时multer的版本是1.4.2它可能不是最新的！**
**甚至可能存在翻译错误！你可能需要阅读原版英语[README](../README.md)**
**此文档仅供参考！**

# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer 是一个 node.js 中间件，用于处理 `multipart/form-data` 类型的表单数据，它主要用于上传文件处理。它是写在 [busboy](https://github.com/mscdex/busboy) 之上非常高效。

**注意**: Multer 不会处理任何非 `multipart/form-data` 类型的表单数据。

## 其它语言

- [English](https://github.com/expressjs/multer/README.md) (英语)
- [한국어](https://github.com/expressjs/multer/doc/README-ko.md) (朝鲜语)
- [Русский язык](https://github.com/expressjs/multer/doc/README-ru.md) (俄語)
- [Português](https://github.com/expressjs/multer/doc/README-pt-br.md) (葡萄牙语(巴西))

## 安装

```sh
$ npm install --save multer
```

## 使用

Multer 会添加一个 `body` 对象 以及 `file` 或 `files` 对象 到 express 的 `request` 对象中。
`body` 对象包含表单中的普通文本域信息，`file` 或 `files` 对象包含对象表单上传的文件信息。

基本使用方法:

不要忘了你的表单需要指定`enctype="multipart/form-data"`
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
  // req.file 是 `avatar` 文件的信息
  // req.body 如果存在的话，将具有文本域数据
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files 是 `photos` 文件数组的信息
  // req.body 如果存在的话，将具有文本域数据
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files 是一个对象 (String -> Array) 键是文件名，值是文件数组
  //
  // 例如：
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body 如果存在的话，将具有文本域数据
})
```

如果你需要处理一个只有文本域的表单，你应当使用 `.none()`方法:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body 只包含文本域
})
```
下面是一个将multer用于HTML表单处理的例子，请特别注意 `enctype="multipart/form-data"` 和 `name="uploaded_file"`数据域:
```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file"><!--这里选择上传文件-->
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers"><!--这里是一个文本域，可以输入一些信息-->
    <input type="submit" value="Get me the stats!" class="btn btn-default"><!--这里提交处理按钮-->            
  </div>
</form>
```
然后在服务器端的javascript文件中添加下述行来处理接收到的表单（文件和文本域（body））。在upload函数处理时，表单中具体的`name`（名称）字段非常重要，因为它将告诉multer应该在哪个字段中查找文件信息。如果这些字段在HTML表单和服务器上不相同，则上传将失败：
```javascript
var multer  = require('multer')
var upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
   // req.file  这里是上面表单中文件信息所在字段名,这里是 'uploaded_file'
   // req.body 如果存在，这里将放置文本域（字段）信息
   console.log(req.file, req.body)
});
```

## API

### 文件信息

每个文件具有下面的信息:

Key键名 | 描述 | 备注
--- | --- | ---
`fieldname` | 文件信息所在字段名称，由表单指定 |
`originalname` | 用户计算机上的文件的名称 |
`encoding` | 文件编码 |
`mimetype` | 文件的 MIME 类型 |
`size` | 文件大小（字节单位） |
`destination` | 保存路径 | `DiskStorage`
`filename` | 保存在 `destination` 中的文件名 | `DiskStorage`
`path` | 已上传文件的完整路径 | `DiskStorage`
`buffer` | 一个存放了整个文件的 `Buffer`对象  | `MemoryStorage`

### `multer(opts)` multer的可选项

Multer 接受一个可选(参数)对象，其中最基本的是 `dest` 属性，这将告诉 Multer 将上传文件保存在哪。如果你省略可选(参数)对象，这些文件将保存在内存中，永远不会真正写入磁盘。

默认情况下，Multer将重命名文件以避免命名冲突。重命名功能可根据您的需要定制。

以下是可以传递给 Multer 的可选(参数)对象。

Key键名 |描述
--- | ---
`dest` 或 `storage` | 在哪里存储文件
`fileFilter` | 文件过滤器，控制哪些文件可以被接受
`limits` | 限制上传的数据
`preservePath` | 保存包含文件名的完整文件路径，而不是仅保留基本名称

通常，一般的网页应用，只需要设置 `dest` 属性，像这样：

```javascript
const upload = multer({ dest: 'uploads/' })
```

如果你想在上传时进行更多的控制，你可以使用 `storage` 选项替代 `dest`。Multer 具有 `DiskStorage` 和 `MemoryStorage` 两个存储引擎；另外还可以从第三方获得更多可用的引擎。

#### `.single(fieldname)` 单文件处理方法

接受一个以 `fieldname` 命名的文件字段。这个文件的信息保存在 `req.file`。

#### `.array(fieldname[, maxCount])` 数组处理方法

接受一个以 `fieldname` 命名的文件数组字段。可以配置 `maxCount` 来限制上传的最大数量。这些文件的信息保存在 `req.files`。

#### `.fields(fields)` 字段处理方法

接受指定 `fields` 的混合文件（可以是多个）和描述的字段。这些文件（可以是多个）的信息保存在 `req.files`。

`fields` 应该是一个对象数组，应该具有 `name` 和可选的 `maxCount` 属性。

Example:

```javascript
[
  { name: 'avatar', maxCount: 1 }, // 这指定了在表单中的'avatar'字段中最大包含1个文件信息
  { name: 'gallery', maxCount: 8 } // 这指定了在表单中的'gallery'字段中最大包含8个文件信息
]
```

#### `.none()` 纯文本域处理方法

只接受文本域。如果任何文件上传到这个模式，将发生 "LIMIT\_UNEXPECTED\_FILE" 错误。

#### `.any()`

接受一切上传的文件。文件信息数组将保存在 `req.files`。

**警告:** 确保始终处理用户上载的文件。永远不要将 multer 用作为全局中间件，因为恶意用户可以上传文件到一个你没有预料到的路由，应该只在你需要处理上传文件的路由上使用此功能。

### 存储(`storage`) 

#### 磁盘存储引擎 (`DiskStorage`)

磁盘存储引擎可以让你完全控制文件在磁盘的存储。

```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage })
```

有两个选项可用，`destination` 和 `filename`。他们都是用来确定文件存储位置的函数。

`destination` 是用来确定上传的文件应该存储在哪个文件夹中。也可以提供一个 `string` (例如 `'/tmp/uploads'`)。如果没有设置 `destination`，则使用操作系统默认的临时文件夹。

**注意:** 如果你提供的 `destination` 是一个函数，你需要负责创建文件夹。当提供一个字符串，multer 将确保这个文件夹是你创建的。

`filename` 用于确定文件夹中的文件名的确定。 如果没有设置 `filename`，每个文件将设置为一个随机文件名，并且是没有扩展名的。

**注意:** Multer 不会为你添加任何扩展名，你的程序应该返回一个完整的文件名。

每个函数都传递了请求对象 (`req`) 和一些关于这个文件的信息 (`file`)，有助于你的决策。

注意 `req.body` 可能还没有完全填充，这取决于向客户端发送字段和文件到服务器的顺序（译者注：一般建议构建请求字段时，非文件类型字段放置在前面）。

要了解回调（callback）中使用的调用约定（需要将null作为第一个参数传递），请参阅[Node.js的错误处理](https://www.joyent.com/node-js/production/design/errors)

#### 内存存储引擎 (`MemoryStorage`)

内存存储引擎将文件存储在内存中的 `Buffer` 对象里，它没有任何选项。

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

当使用内存存储引擎时，文件信息将包含一个名为 `buffer`的字段，里面包含了整个文件数据。

**警告**: 当你使用内存存储，而上传非常大的文件，或者非常多的小文件，可能会导致你的应用程序内存溢出。

### `limits`限制
一个对象，指定一些数据信息的限制。Multer 直接将这个对象传递给busboy，详细的特性可以在 [busboy's page](https://github.com/mscdex/busboy#busboy-methods) 找到。

可以使用下面这些:

Key键名 | 描述| 默认值
--- | --- | ---
`fieldNameSize` | 字段 名字最大长度 | 100 bytes
`fieldSize` | 字段 值的最大长度  | 1MB
`fields` | 非文件 字段 的最大数量 | 无限
`fileSize` | 在 multipart 表单中，文件最大长度 (字节单位) | 无限
`files` | 在 multipart 表单中，文件最大数量 | 无限
`parts` | 在 multipart 表单中，part 传输的最大数量(fields + files) | 无限
`headerPairs` | 在 multipart 表单中，键值对最大组数 | 2000

设置 limits 可以帮助保护你的站点，抵御拒绝服务 (DoS) 攻击。

### `fileFilter`
设置一个函数来控制什么文件可以上传以及什么文件应该跳过，这个函数应该看起来像这样：

```javascript
function fileFilter (req, file, cb) {

  // 这个函数应该用一个boolean值来判断是否调用 `cb` 
  // 以指示是否应接受该文件

  // 拒绝这个文件，使用`false`，像这样:
  cb(null, false)

  // 许可这个文件，使用`true`，像这样:
  cb(null, true)

  // 如果有问题，你可以总是这样发送一个错误:
  cb(new Error('I don\'t have a clue!')) // 对应中文信息版本 cb(new Error('我不知该如何处理!')) 

}
```

## 错误处理机制

当遇到一个错误，multer 将会把错误发送给 express。你可以使用[express标准方式](http://expressjs.com/guide/error-handling.html)实现一个比较好的错误展示页。

如果你想捕捉 multer 发出的错误，你可以自己调用中间件程序。如果你只想捕捉 [Multer 错误](https://github.com/expressjs/multer/blob/master/lib/multer-error.js)，你可以使用 `multer` 对象下的 `MulterError` 类实例 (例如`err instanceof multer.MulterError`)。

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      //对 文件上传时产生的Multer错误  进行专门处理
    } else if (err) {
      //对 文件上传时产生的其它（类型）错误 进行处理
    }

    // 一切顺利（错误处理完后）处理。 
  })
})
```

## 定制存储引擎

如果你想要构建自己的存储引擎，请参看 [Multer 存储引擎](/StorageEngine.md) 。

## License

[MIT](LICENSE)
