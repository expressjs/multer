# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer là một middleware cho node.js dùng để xử lý `multipart/form-data`, chủ yếu phục vụ việc upload file. Thư viện này được xây dựng
trên nền [busboy](https://github.com/mscdex/busboy) để đạt hiệu năng tối đa.

**LƯU Ý**: Multer sẽ không xử lý bất kỳ form nào không phải là multipart (`multipart/form-data`).

## Bản dịch

README này cũng có sẵn ở các ngôn ngữ khác:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | Tiếng Anh       |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Tiếng Ả Rập     |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Tiếng Trung (Giản thể) |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | Tiếng Pháp      |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | Tiếng Nhật      |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | Tiếng Indonesia |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | Tiếng Hàn       |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Tiếng Bồ Đào Nha (Brazil) |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Tiếng Nga       |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | Tiếng Tây Ban Nha |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | Tiếng Tamil     |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | Tiếng Uzbek     |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | Tiếng Thổ Nhĩ Kỳ |


## Cài đặt

```sh
$ npm install multer
```

## Sử dụng

Multer thêm một object `body` và một object `file` hoặc `files` vào object `request`. Object `body` chứa giá trị của các trường văn bản trong form, còn object `file` hoặc `files` chứa các file được upload thông qua form.

Ví dụ sử dụng cơ bản:

Đừng quên thêm `enctype="multipart/form-data"` vào form của bạn.

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
  // req.file là file `avatar`
  // req.body sẽ chứa các trường văn bản, nếu có
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files là mảng các file `photos`
  // req.body sẽ chứa các trường văn bản, nếu có
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files là một object (String -> Array) trong đó fieldname là key, và value là mảng các file
  //
  // ví dụ:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body sẽ chứa các trường văn bản, nếu có
})
```

Trong trường hợp bạn cần xử lý một multipart form chỉ chứa văn bản, bạn nên dùng phương thức `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body chứa các trường văn bản
})
```

Dưới đây là một ví dụ về cách dùng multer với một form HTML. Hãy đặc biệt chú ý tới các trường `enctype="multipart/form-data"` và `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Sau đó, trong file javascript của bạn, hãy thêm những dòng sau để truy cập cả file lẫn body. Điều quan trọng là bạn phải dùng đúng giá trị của trường `name` trong form cho hàm upload. Giá trị này cho multer biết cần tìm file ở trường nào trong request. Nếu các trường này không khớp nhau giữa form HTML và server của bạn, việc upload sẽ thất bại:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file là tên file của bạn trong form ở trên, ở đây là 'uploaded_file'
  // req.body sẽ chứa các trường văn bản, nếu có
  console.log(req.file, req.body)
});
```



## API

### Thông tin file

Mỗi file chứa các thông tin sau:

Thuộc tính | Mô tả | Ghi chú
--- | --- | ---
`fieldname` | Tên trường được khai báo trong form |
`originalname` | Tên file trên máy của người dùng, hoặc đường dẫn đầy đủ khi `preservePath: true` |
`encoding` | Kiểu encoding của file |
`mimetype` | Mime type của file |
`size` | Kích thước của file (theo byte) |
`destination` | Thư mục mà file đã được lưu vào | `DiskStorage`
`filename` | Tên của file bên trong `destination` | `DiskStorage`
`path` | Đường dẫn đầy đủ tới file đã upload | `DiskStorage`
`buffer` | Một `Buffer` chứa toàn bộ file | `MemoryStorage`

### `multer(opts)`

Multer nhận vào một object options, trong đó cơ bản nhất là thuộc tính `dest`,
cho Multer biết cần upload file vào đâu. Trong trường hợp bạn bỏ qua object
options này, các file sẽ được giữ trong bộ nhớ và không bao giờ được ghi xuống đĩa.

Mặc định, Multer sẽ đổi tên các file để tránh xung đột tên. Hàm đổi tên này có
thể được tùy biến theo nhu cầu của bạn.

Dưới đây là các tùy chọn có thể truyền cho Multer.

Thuộc tính | Mô tả
--- | ---
`dest` hoặc `storage` | Nơi lưu trữ file
`fileFilter` | Hàm kiểm soát những file nào được chấp nhận
`limits` | Giới hạn của dữ liệu được upload
`preservePath` | Giữ nguyên đường dẫn đầy đủ do client cung cấp trong `file.originalname` thay vì chỉ giữ tên file
`defParamCharset` | Bộ ký tự mặc định dùng cho giá trị của các tham số trong header của từng part (ví dụ: filename) mà không phải là tham số mở rộng (tức là không chứa charset tường minh). Mặc định: `'latin1'`

Với một web app thông thường, có thể chỉ cần `dest`, và được cấu hình như trong
ví dụ sau.

```javascript
const upload = multer({ dest: 'uploads/' })
```

Khi `preservePath` được bật, Multer sẽ chuyển tiếp nguyên vẹn tên file nhận được
cùng với mọi phân đoạn đường dẫn mà client cung cấp. Giá trị này được đưa ra qua
`file.originalname`; nó không làm thay đổi thư mục đích, không tạo thư mục, và
cũng không làm sạch (sanitize) đường dẫn thay cho bạn. `file.originalname` luôn
là dữ liệu do client cung cấp và phải được xem là không đáng tin cậy; với
`preservePath`, nó còn chứa thêm các phân đoạn đường dẫn mà client đã gửi. Hãy
chuẩn hóa hoặc kiểm tra giá trị này trước khi dùng nó trong hàm `filename` tùy
biến hoặc trong storage engine.

Nếu bạn muốn kiểm soát nhiều hơn việc upload, bạn nên dùng tùy chọn `storage`
thay vì `dest`. Multer đi kèm sẵn hai storage engine là `DiskStorage`
và `MemoryStorage`; ngoài ra còn có nhiều engine khác từ bên thứ ba.

#### `.single(fieldname)`

Chấp nhận một file duy nhất với tên `fieldname`. File này sẽ được lưu
trong `req.file`.

#### `.array(fieldname[, maxCount])`

Chấp nhận một mảng các file, tất cả đều có tên `fieldname`. Có thể tùy chọn báo lỗi nếu
có nhiều hơn `maxCount` file được upload. Mảng các file sẽ được lưu trong
`req.files`.

#### `.fields(fields)`

Chấp nhận nhiều loại file khác nhau, được chỉ định bởi `fields`. Một object chứa các mảng file
sẽ được lưu trong `req.files`.

`fields` phải là một mảng các object có `name` và tùy chọn thêm `maxCount`.
Ví dụ:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Chỉ chấp nhận các trường văn bản. Nếu có bất kỳ file nào được upload, một lỗi với mã
"LIMIT\_UNEXPECTED\_FILE" sẽ được phát sinh.

#### `.any()`

Chấp nhận tất cả các file được gửi lên. Một mảng các file sẽ được lưu trong
`req.files`.

**CẢNH BÁO:** Hãy chắc chắn rằng bạn luôn xử lý các file mà người dùng upload.
Đừng bao giờ thêm multer như một middleware toàn cục, vì một người dùng xấu có thể upload
file tới một route mà bạn không lường trước. Chỉ dùng hàm này trên những route
mà bạn thực sự xử lý các file được upload.

### `storage`

#### `DiskStorage`

Disk storage engine cho phép bạn toàn quyền kiểm soát việc lưu file xuống đĩa.

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

Có hai tùy chọn khả dụng là `destination` và `filename`. Cả hai đều là
hàm dùng để xác định file sẽ được lưu ở đâu.

`destination` được dùng để xác định các file upload sẽ được lưu vào thư mục
nào. Giá trị này cũng có thể là một `string` (ví dụ: `'/tmp/uploads'`). Nếu không
chỉ định `destination`, thư mục tạm mặc định của hệ điều hành sẽ được dùng.

**Lưu ý:** Bạn phải tự chịu trách nhiệm tạo thư mục khi truyền
`destination` dưới dạng hàm. Khi truyền vào một string, multer sẽ đảm bảo
thư mục đó được tạo cho bạn.

`filename` được dùng để xác định file sẽ được đặt tên là gì bên trong thư mục.
Nếu không chỉ định `filename`, mỗi file sẽ được gán một tên ngẫu nhiên không
kèm theo phần mở rộng.

**Lưu ý:** Multer sẽ không tự thêm phần mở rộng file cho bạn, hàm của bạn
phải trả về tên file đầy đủ kèm phần mở rộng.

Mỗi hàm đều được truyền vào cả request (`req`) lẫn một số thông tin về
file (`file`) để hỗ trợ việc ra quyết định.

Lưu ý rằng `req.body` có thể chưa được điền đầy đủ tại thời điểm đó. Điều này phụ thuộc vào
thứ tự mà client gửi các trường và file lên server.

Để hiểu quy ước gọi callback được sử dụng (cần truyền
null làm tham số đầu tiên), hãy tham khảo
[Xử lý lỗi trong Node.js](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Memory storage engine lưu các file trong bộ nhớ dưới dạng các object `Buffer`. Engine này
không có tùy chọn nào.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Khi dùng memory storage, thông tin file sẽ chứa một trường tên là
`buffer` chứa toàn bộ nội dung file.

**CẢNH BÁO**: Việc upload các file rất lớn, hoặc upload rất nhanh một số lượng lớn
các file tương đối nhỏ, có thể khiến ứng dụng của bạn cạn kiệt bộ nhớ khi
dùng memory storage.

### `limits`

Một object chỉ định giới hạn kích thước cho các thuộc tính tùy chọn sau. Multer truyền object này trực tiếp vào busboy, và chi tiết về các thuộc tính có thể xem tại [trang của busboy](https://github.com/mscdex/busboy#exports).

Các giá trị số nguyên sau đây có thể được sử dụng:

Thuộc tính | Mô tả | Mặc định
--- | --- | ---
`fieldNameSize` | Kích thước tối đa của tên trường | Infinity
`fieldSize` | Kích thước tối đa của giá trị trường (theo byte) | 1MB
`fields` | Số lượng tối đa các trường không phải file | Infinity
`fileSize` | Với multipart form, kích thước file tối đa (theo byte) | Infinity
`files` | Với multipart form, số lượng tối đa các trường file | Infinity
`parts` | Với multipart form, số lượng part tối đa (fields + files) | Infinity
`headerPairs` | Với multipart form, số lượng tối đa các cặp header key=>value được phân tích | 2000
`fieldNestingDepth` | Số cấp lồng nhau tối đa của tên trường (ví dụ: `a[b][c]` có 2 cấp) | Infinity
`fieldArrayIndexLimit` | Chỉ số mảng dạng số lớn nhất được chấp nhận bên trong tên trường (ví dụ: `a[3]` dùng chỉ số 3) | Infinity

Giới hạn `parts` được kích hoạt ngay khi busboy đạt tới số lượng part đã cấu hình,
chứ không phải chỉ sau khi vượt quá con số đó. Nếu bạn muốn cho phép chính xác một
số lượng trường và file nhất định, hãy đặt `parts` lớn hơn tổng số đó ít nhất một đơn vị.

Việc chỉ định các giới hạn có thể giúp bảo vệ trang web của bạn trước các cuộc tấn công từ chối dịch vụ (DoS).

### `fileFilter`

Đặt tùy chọn này là một hàm để kiểm soát file nào sẽ được upload và file nào
sẽ bị bỏ qua. Hàm này sẽ có dạng như sau:

```javascript
function fileFilter (req, file, cb) {

  // Hàm này phải gọi `cb` với một giá trị boolean
  // để cho biết file có được chấp nhận hay không

  // Để từ chối file này, hãy truyền `false`, như sau:
  cb(null, false)

  // Để chấp nhận file này, hãy truyền `true`, như sau:
  cb(null, true)

  // Bạn luôn có thể truyền vào một lỗi nếu có sự cố xảy ra:
  cb(new Error('I don\'t have a clue!'))

}
```

## Bảo mật

Việc chỉ định các [giới hạn](#limits) có thể giúp bảo vệ trang web của bạn trước các cuộc tấn công từ chối dịch vụ (DoS). Các giới hạn sau được khuyến nghị cho hầu hết các ứng dụng:

- `fileSize` -- đặt bằng kích thước file lớn nhất dự kiến cho trường hợp sử dụng của bạn
- `files` -- đặt bằng số lượng file tối đa trên mỗi request
- `fields` -- đặt bằng số lượng trường văn bản tối đa trên mỗi request
- `fieldNestingDepth` -- đặt bằng độ sâu tối thiểu mà tên trường của bạn cần đến (ví dụ: `3` cho `a[b][c]`)
- `fieldArrayIndexLimit` -- đặt bằng chỉ số mảng lớn nhất mà tên trường của bạn cần đến (ví dụ: `100` cho `a[99]`)

## Xử lý lỗi

Khi gặp lỗi, Multer sẽ chuyển lỗi đó cho Express. Bạn có thể
hiển thị một trang lỗi đẹp mắt bằng [cách chuẩn của express](https://expressjs.com/en/guide/error-handling/).

Nếu bạn muốn bắt riêng các lỗi đến từ Multer, bạn có thể tự gọi
hàm middleware. Ngoài ra, nếu bạn chỉ muốn bắt [các lỗi của Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js), bạn có thể dùng class `MulterError` được gắn kèm trên chính object `multer` (ví dụ: `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Một lỗi của Multer đã xảy ra khi upload.
    } else if (err) {
      // Một lỗi không xác định đã xảy ra khi upload.
    }

    // Mọi thứ đều ổn.
  })
})
```

## Storage engine tùy biến

Để biết cách tự xây dựng storage engine của riêng bạn, hãy xem [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md).

## Giấy phép

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
