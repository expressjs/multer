# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer là một node.js middleware để xử lý `multipart/form-data`, về cơ bản nó được dùng để upload file . Nó được viết
dựa trên [busboy](https://github.com/mscdex/busboy) để có hiệu suất tối đa nhất .

**Ghi chú**: Multer sẽ không xử lý bất cứ form nào không phải multipart (`multipart/form-data`).

## Các bản dịch

README cũng có sẵn cho các ngôn ngữ sau:

- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (Chinese)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (Korean)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (Russian)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (Português Brazil)

## Cài đặt

```sh
$ npm install --save multer
```

## Sử dụng

Multer thêm 1 object `body` và 1 object `file` hoặc `files` vào object `request`. Object `body` chứa giá trị của các
trường text trong form , object `file` hoặc `files` chứa những file được upload thông qua form.

Ví dụ cơ bản:

Đừng quên `enctype="multipart/form-data"` trong form của bạn .

```html

<form action="/profile" method="post" enctype="multipart/form-data">
    <input type="file" name="avatar"/>
</form>
```

```javascript
var express = require('express')
var multer = require('multer')
var upload = multer({ dest: 'uploads/' })

var app = express()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file là file `avatar`
  // req.body sẽ chứa các trường text, nếu có
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files là một mảng file `photos`
  // req.body sẽ chứa các trường text, nếu có
})

var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files là một object (String -> Array) trong đó key là fieldname, và giá trị là mảng các file
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body chứa các trường text, nếu có
})
```

Trong trường hợp bạn cần xử lý text-only multipart form, bạn nên sử dụng phương thức `.none()`

```javascript
var express = require('express')
var app = express()
var multer = require('multer')
var upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body chứa các trường text
})
```

Đây là một ví dụ khi sử dụng multer trong một HTML form. Hãy chú ý đến trường `enctype="multipart/form-data"`
và `name="uploaded_file"` :

```html

<form action="/stats" enctype="multipart/form-data" method="post">
    <div class="form-group">
        <input type="file" class="form-control-file" name="uploaded_file">
        <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
        <input type="submit" value="Get me the stats!" class="btn btn-default">
    </div>
</form>
```

Sau đó trong file javascript bạn có thể thêm những dòng sau để truy cập vào cả file và body. Chú ý sử dụng giá trị của
trường `name` từ form trong hàm upload của bạn. Nó chỉ cho multer biết trường nào trong request nó nên tìm kiếm file
trong đó . Nếu các trường này không giống nhau giữa HTML form và server của bạn . Upload sẽ thất bại .

```javascript
var multer = require('multer')
var upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file là file bạn đã upload trong form bên trên , ở đây là 'uploaded_file'
  // req.body sẽ chứa các trường text, nếu có
  console.log(req.file, req.body)
});
```

## API

### Thông tin về file

Mỗi file chứa các thông sau như sau:

Key | Mô tả | Ghi chú
--- | --- | ---
`fieldname` | Tên trường được chỉ ra ở trong form |
`originalname` | Tên của file trên máy tính người dùng |
`encoding` | Kiểu mã hóa file |
`mimetype` | Kiểu file |
`size` | Kích thước của file với đơn vị là bytes |
`destination` | Thư mục mà file được lưu | `DiskStorage`
`filename` | Tên file nằm trong `destination` | `DiskStorage`
`path` | Đường dẫn đến file được upload | `DiskStorage`
`buffer` | `Buffer` của toàn bộ file | `MemoryStorage`

### `multer(opts)`

Multer chấp nhận một object tùy chỉnh , với thuộc tính cơ bản nhất là dest , chỉ cho Multer biết nên upload file vào đâu
. Trong trường hợp bạn bỏ qua object này , các file sẽ được lưu giữ ở bộ nhớ và không bao giờ được ghi vào đĩa.

Mặc định, Multer sẽ đổi tên của file để tránh xung đột tên giữa chúng. Hàm đổi tên có thể được tùy chỉnh theo nhu cầu
của bạn

Sau đây là những tùy chọn có thể được truyền vào Multer.

Key | Mô tả
--- | ---
`dest` hoặc `storage` | Nơi để lưu file
`fileFilter` | Hàm để điều khiển những file nào được chấp nhận
`limits` | Giới hạn của dữ liệu được upload
`preservePath` | Giữ toàn bộ đường dẫn của file thay vì chỉ tên

Trong một web app bình thường, chỉ `dest` có thể được yêu cầu, và cấu hình như ví dụ sau.

```javascript
var upload = multer({ dest: 'uploads/' })
```

Nếu bạn muốn tùy chỉnh nhiều hơn , bạn sẽ muốn sử dụng tùy chọn `storage` thay vì `dest` . Multer mang đến 2 storage
engines `DiskStorage` và `MemoryStorage`; Có nhiều engine khác có sẵn từ các bên thứ 3.

#### `.single(fieldname)`

Chấp nhận 1 file duy nhất với tên `fieldname`. File đó sẽ được lưu trữ ở `req.file`.

#### `.array(fieldname[, maxCount])`

Chấp nhận một mảng file, tất cả với tên `fieldname`. Có thể xảy ra lỗi nếu số file được upload nhiều hơn `maxCount`.
Mảng các file được lưu trữ ở `req.files`.

#### `.fields(fields)`

Chấp nhận hỗn hợp các file, được chỉ rõ bởi `fields`. Một object với mảng các file sẽ được lưu trữ trong `req.files`.

`fields` nên là một mảng object với tên và có thể với `maxCount`. Ví dụ:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Chấp nhận chỉ các trường text. Nếu có bất cứ file nào được upload, lỗi "LIMIT\_UNEXPECTED\_FILE" sẽ xuất hiện.

#### `.any()`

Chấp nhận tất cả các file . Một mảng các file sẽ được lưu trữ ở
`req.files`.

**Cảnh báo:** Đảm bảo rằng bạn luôn xử lý những file mà người dùng upload . Đừng bao giờ dùng multer như một global
middlware vì một người dùng độc hại có thể upload những file đến một đường dẫn bạn không không biết. Chỉ sử dụng hàm này
trên đường dẫn mà bạn sẽ xử lý file upload.

### `storage`

#### `DiskStorage`

Disk storage engine cho bạn toàn bộ quyền hạn khi lưu trữ file vào ổ cứng.

```javascript
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

var upload = multer({ storage: storage })
```

Có 2 tùy chọn có sẵn, `destination` và `filename`. Cả 2 hàm này đều xác định nơi file sẽ được lưu.

`destination` được sử dụng để xác định thư mục nào file upload sẽ được lưu. Nó cũng có thể được gán với kiểu `string`
(e.g. `'/tmp/uploads'`). Nếu `destination` không được gán, thư mục tạm mặc định của hệ điều hành sẽ được dùng.

**Ghi chú:** Bạn chịu trách nhiệm cho việc tạo thư mục khi cung cấp `destination` như một hàm. Khi được gán cho một
string, multer sẽ đảm bảo thư mục đó được tạo cho bạn.

`filename` được dùng để xác định tên của file sẽ là gì trong thư mục. Nếu `filename` không được dùng, mỗi file sẽ được
gán cho một tên bất kì không bao gồm bất kì file extension nào.

**Ghi chú:** Multer sẽ không nối thêm bất cứ file extension nào cho bạn, hàm của bạn nên trả về tên hoàn thiện của file
với file extension.

Mỗi hàm được truyền cả request (`req`) và một vài thông tin về file (`file`) để hỗ trợ bạn có thêm các lựa chọn.

Lưu ý rằng `req.body` có thể chưa được điền đầy đủ thông tin. Nó phụ thuộc vào thứ tự mà client chuyển các trường và
file tới server.

Để hiểu quy ước gọi hàm callback (cần phải truyền null như tham số đầu tiên), tham khảo
[Node.js error handling](https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Memory storage engine lưu trữ file trong bộ nhớ như là `Buffer` object. Không có bất cứ tùy chọn nào.

```javascript
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
```

Khi sử dụng memory storage, object file sẽ chứa một trường gọi là `buffer` nó chứa toàn bộ file.

**Cảnh báo**: Upload file quá nặng, hoặc nhiều file tương đối nhỏ trong một thời gian cực kì ngắn, có thể dẫn đến ứng
dụng của bạn sử dụng vượt quá bộ nhớ.

### `limits`

Một object chỉ ra kích thước giới hạn của các thuộc tính tùy chọn sau đây. Multer truyền đối tượng này vào busboy trực
tiếp, và chi tiết về các thuộc tính này có thể tìm ở  [busboy's page](https://github.com/mscdex/busboy#busboy-methods).

Các trường số nguyên có sẵn sau đây:

Key | Mô tả | Giá trị mặc định
--- | --- | ---
`fieldNameSize` | Kích thước tối đa của tên file | 100 bytes
`fieldSize` | Kích thước tối đa của trường (bytes) | 1MB
`fields` | Số lượng tối đa của các trường không phải là file | Infinity
`fileSize` | Dành cho multipart form, kích thước tối đa của file (bytes) | Infinity
`files` | Dành cho multipart form, số lượng tối đa của các trường file | Infinity
`parts` | Dành cho multipart form, số lượng tối đa của các phần (cả file lẫn không phải file) | Infinity
`headerPairs` | Dành cho multipart form, số lượng tối đa của cặp header key=> value để phân tích | 2000

Chỉ ra giới hạn có thể giúp bảo vệ ứng dụng của bạn với tấn công từ chối dịch vụ (DoS).

### `fileFilter`

Gán nó cho một hàm để điều khiển file nào có thể được upload và nên bỏ qua. Hàm này nên trông như sau:

```javascript
function fileFilter (req, file, cb) {

  // Hàm này nên gọi `cb` với boolean để chỉ ra nếu một file được chấp nhận.

  // Để loại bỏ file này hãy truyền `false`, như sau:
  cb(null, false)

  // Để chấp nhận hãy truyền `true`, như sau:
  cb(null, true)

  // Bạn luôn có thể truyền một lỗi nếu có gì đó sai:
  cb(new Error('I don\'t have a clue!'))

}
```

## Xử lý lỗi:

Khi bắt gặp một lỗi, Multer sẽ ủy thác lỗi cho Express. Bạn có thể hiển thị mỗi trang lỗi tốt khi sử dụng
[the standard express way](http://expressjs.com/guide/error-handling.html).

Nếu bạn muốn bắt riêng lỗi từ Multer, bạn có thể tự gọi hàm middleware. Cũng có thể, nếu bạn muốn bắt
riêng [Lỗi từ Multer](https://github.com/expressjs/multer/blob/master/lib/multer-error.js), bạn có thể sử
dụng `MulterError` class nó được đính kèm với `multer` object (e.g. `err instanceof multer.MulterError`).

```javascript
var multer = require('multer')
var upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      // Một lỗi từ Multer xảy ra khi upload.
    } else if (err) {
      // Một lỗi không xác định khi upload.
    }

    // Mọi thứ đều hoạt động tốt.
  })
})
```

## Tùy chỉnh storage engine

Thông tin về cách để xây dựng storage engine của riêng bạn, xem
[Multer Storage Engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## Bản quyền

[MIT](LICENSE)
