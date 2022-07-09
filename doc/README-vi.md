# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer là thư viện trung gian hỗ trợ việc xử lý `multipart/form-data`, mục đích chính cho việc upload file. Thư viện này dựa trên [busboy](https://github.com/mscdex/busboy) để hiệu quả hơn.

**CHÚ Ý**: Multer sẽ không xử lý bất kỳ form nào ngoài multipart (`multipart/form-data`).

## Dịch:

Các bạn có thể đọc ở các bản dịch ngôn ngữ khác:

- [English](https://github.com/expressjs/multer/blob/master/README.md) (Tiếng Anh)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (Chinese)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (Korean)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (Russian)

## Cài đặt

```sh
$ npm install --save multer
```

## Sử dụng

Multer gắn thêm một object `body` và một object `file` (hoặc `files` trường hợp upload nhiều file) vào object `request`. Object `body` này sẽ chứa các biến text của form, còn object `file` (hoặc `files`) sẽ chứa các file được upload qua form.

Cách sử sụng:

Phải thêm `enctype="multipart/form-data"` vào form của bạn.

```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" />
</form>
```

```javascript
var express = require('express');
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });

var app = express();

app.post('/profile', upload.single('avatar'), function(req, res, next) {
  // req.file là 1 file `avatar` được upload
  // req.body sẽ giữ thông tin gắn kèm (vd: text fields), nếu có
});

app.post('/photos/upload', upload.array('photos', 12), function(
  req,
  res,
  next
) {
  // req.files là một mảng của các file `photos`
  // req.body sẽ giữ thông tin gắn kèm (vd: text fields), nếu có
});

var cpUpload = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 },
]);
app.post('/cool-profile', cpUpload, function(req, res, next) {
  // req.files là một object kiểu (String -> Array) mà fieldname là key, và value là mảng các files
  //
  // vd:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body sẽ giữ thông tin gắn kèm (vd: text fields), nếu có
});
```

Trong trường hợp bạn cần xử lý một multipart form chỉ chứa text, bạn nên sử dụng hàm `.none()`:

```javascript
var express = require('express');
var app = express();
var multer = require('multer');
var upload = multer();

app.post('/profile', upload.none(), function(req, res, next) {
  // req.body sẽ giữ thông tin gắn kèm (vd: text fields)
});
```

## API

### Thông tin File được upload

Mỗi file sẽ chứa các thông tin sau:

| Thuộc tính     | Mô tả                                                           | Ghi chú                   |
| -------------- | --------------------------------------------------------------- | ------------------------- |
| `fieldname`    | tên mỗi thuộc tính ở trong form                                 |
| `originalname` | Tên của file nằm trên máy của người dùng, trước khi được upload |
| `encoding`     | Kiểu Encoding của file                                          |
| `mimetype`     | Mime type của file                                              | `image/jpeg`, `image/png` |
| `size`         | Kích thước của file (theo bytes)                                |
| `destination`  | Đường dẫn tới thư mục file được lưu                             | `DiskStorage`             |
| `filename`     | Tên của file (ở trong `destination`)                            | `DiskStorage`             |
| `path`         | Đường dẫn đầy đủ tới file đã upload                             | `DiskStorage`             |
| `buffer`       | Một `Buffer` của toàn bộ file                                   | `MemoryStorage`           |

### Tham số `multer(opts)`

Multer chấp nhận một biến options. Cơ bản là thuộc tính `dest`, là nơi sẽ lưu
file được uplaod. Trong trường hợp bỏ qua options này, file sẽ được giữ trong
RAM và không được lưu trên ổ cứng.

Mặc định, Multer sẽ đổi tên các file, vì vậy để tránh bị trùng lặp, bạn có thể
tùy biến hàm đổi tên này.

Dưới đây là các tùy chọn mà bạn có thể sử dụng:

| Thuộc tính            | Mô tả                                              |
| --------------------- | -------------------------------------------------- |
| `dest` hoặc `storage` | Nơi lưu trữ file                                   |
| `fileFilter`          | Hàm để xử lý chỉ những file nào mới được chấp nhận |
| `limits`              | Giới hạn dung lượng file được upload               |
| `preservePath`        | Giữ đầy đủ đường dẫn tới file thay vì chỉ tên file |

Nói chung với web app, chỉ `dest` mới cần khai báo, như bên dưới:

```javascript
var upload = multer({ dest: 'uploads/' });
```

Nếu bạn muốn tùy biến việc upload, bạn sẽ muốn dùng tùy chọn `storage` thay vì `dest`.
Multer sẽ sử dụng 1 trong 2 cách `DiskStorage` và `MemoryStorage`; Hoặc các cách khác (với các thư viện ngoài).

#### `.single(fieldname)`

Chấp nhận chỉ một file với tên thuộc tính `fieldname`. File này truy cập qua `req.file`.

#### `.array(fieldname[, maxCount])`

Chấp nhận mảng các file, tất cả đều với tên `fieldname`. Một lỗi sẽ bắn ra nếu có
nhiều hơn `maxCount` file được upload. Các file này được lưu ở `req.files`.

#### `.fields(fields)`

Chấp nhận nhiều file với thuộc tính `fields`. Một object với mảng các file được lưu ở `req.files`.

`fields` là một mảng các object với thuộc tính `name` và có thể có thuộc tính `maxCount` hoặc không.

Ví dụ:

```javascript
[{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }];
```

#### `.none()`

Chỉ chấp nhận các giá trị text trong form. Nếu bất kỳ file được đính
kèm, một lỗi với mã "LIMIT_UNEXPECTED_FILE" sẽ bắn ra.

#### `.any()`

Chấp nhận tất cả file đến từ bất kỳ nguồn nào. Một mảng các file sẽ được lưu
ở `req.files`.

**CHÚ Ý:** Hãy chắc chắn bạn không bỏ qua bất kỳ file nào mà người dùng upload.
Đừng bao giờ khai báo Multer như một middleware toàn cục, vì người dùng có thể upload
các file tới một api nào đó mà bạn không biết. Chỉ sử dụng hàm này ở trên api mà bạn
muốn xử lý việc upload file.

### `storage`

#### `DiskStorage`

Cơ chế lưu trữ trên ổ đĩa cho phép bạn có đầy đủ quyền để thao tác với file.

```javascript
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, '/tmp/my-uploads');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  },
});

var upload = multer({ storage: storage });
```

Có 2 tùy chọn, `destination` và `filename`. Chúng đều dùng để xác định nơi nào
file sẽ được lưu trữ.

`destination` được dùng để xác định thư mục nào file được upload. Có thể là một
`string` (vd: `'/tmp/uploads'`). Nếu không khai báo `destination`, thư mục tạm
(của hệ điều hành) sẽ được dùng để chứa các file đó.

**Ghi chú:** Nếu bạn khai báo `destination` là một hàm, bạn phải tự tạo đường
dẫn. Còn nếu truyền vào một string, multer sẽ đảm bảo việc tạo đường dẫn đó cho bạn.

`filename` được dùng để xác định file nào sẽ được lưu trong thư mục. Nếu không
có `filename` nào, mỗi file sẽ nhận tên ngẫu nhiên mà không bao gồm đuôi của file.

**Ghi chú:** Multer sẽ không thêm bất kỳ đuôi file nào cho bạn, hàm của bạn nên
trả về một file với đuôi của nó.

Mỗi hàm được truyền cả ở request (`req`) và thông tin về file (`file`) để xử lý.

Chú ý `req.body` có thể không chứa đầy đủ thông tin, phụ thuộc việc thứ tự các
trường dữ liệu và file được gửi tới server lúc nào.

#### `MemoryStorage`

Memory storage lưu các file ở bộ nhớ máy dưới dạng một object `Buffer`. Nó không
có bất kỳ tùy chọn nào.

```javascript
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
```

Khi sử dụng memory storage, thông tin file sẽ chứa một trường `buffer`, trường
này chứa toàn bộ file.

**CHÚ Ý**: Việc upload file rất lớn, hoặc tương tự việc nhiều file nhỏ, có thể
gây ra tràn bộ nhớ khi memory storage được sử dụng.

### `limits`

Một object mô tả giới hạn kích thước trong thuộc tính nên được sử dụng. Multer truyền object này trực tiếp vào busboy, và chi tiết của busboy có thể xem thêm ở [busboy's page](https://github.com/mscdex/busboy#busboy-methods).

Các số dưới dây cũng có thể được dùng:

| Thuộc tính      | Mô tả                                                                | Giá trị mặc định |
| --------------- | -------------------------------------------------------------------- | ---------------- |
| `fieldNameSize` | Độ dài tối đa của tên field                                          | 100 bytes        |
| `fieldSize`     | Kích thước tối đa của mỗi field (theo bytes)                         | 1MB              |
| `fields`        | Số lượng tối đa của các fields không phải là file                    | Infinity         |
| `fileSize`      | Cho multipart forms, kích thước tối đa của file (theo bytes)         | Infinity         |
| `files`         | Cho multipart forms, số lượng file tối đa                            | Infinity         |
| `parts`         | Cho multipart forms, số lượng tối đa của parts (gồm fields + files)  | Infinity         |
| `headerPairs`   | Cho multipart forms, số tối đa trong header cặp key=>value để truyền | 2000             |

Khai báo các giới hạn này giúp cho site của bạn chống lại các tấn công nguy hiểm (DoS).

### `fileFilter`

Dùng hàm này để xử lý các file nào cho phép và bị bỏ qua. Xem ví dụ dưới dây:

```javascript
function fileFilter(req, file, cb) {
  // hàm này sẽ gọi callback `cb` với 1 biến boolean
  // để chỉ ra rằng file có được chấp nhận hay không

  // Để chặn file này, truyền `false` như sau:
  cb(null, false);

  // Để chấp nhận file này, truỳen `true`, như sau:
  cb(null, true);

  // Hoặc bạn có thể truyền vào 1 lỗi nếu có vấn đề xảy ra:
  cb(new Error("I don't have a clue!"));
}
```

## Error handling

Khi một lỗi xảy ra, Multer sẽ gửi lỗi đó cho Express. Bạn có thể hiển thị
đẹp hơn sử dụng [cách bắt lỗi chuẩn của Express](http://expressjs.com/guide/error-handling.html).

Nếu bạn muốn bắt các lỗi cụ thể từ Multer, bạn có thể tự gọi hàm trung gian (middleware) này. Ngoài ra, nếu bạn chỉ muốn bắt [lỗi của Multer](https://github.com/expressjs/multer/blob/master/lib/multer-error.js), bạn có thể dùng class `MulterError` được đính kèm với chính object `multer` (vd: `err instanceof multer.MulterError`).

```javascript
var multer = require('multer');
var upload = multer().single('avatar');

app.post('/profile', function(req, res) {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // Một lỗi của Multer xảy ra khi upload.
    } else if (err) {
      // Một lỗi không xác định xảy ra khi upload.
    }

    // Mọi thứ khác chạy ok.
  });
});
```

## Tùy chọn storage engine

Để làm sao tự xây dựng cơ chế lưu file riêng của mình, hãy xem [Multer Storage Engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## License

[MIT](LICENSE)
