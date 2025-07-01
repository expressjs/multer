# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

<div dir="rtl">

مالتر (Multer) یک میان‌افزار (Middleware) برای Node.js است که برای پردازش داده‌های چندبخشی (multipart/form-data) استفاده می‌شود و کاربرد اصلی آن برای آپلود فایل‌هاست. این کتابخانه بر پایه‌ی [busboy](https://github.com/mscdex/busboy) نوشته شده تا حداکثر کارایی را ارائه دهد.

**نکته:** مالتر هیچ فرم HTMLای را که نوع آن `multipart/form-data` نباشد، پردازش نمی‌کند.

## ترجمه ها

این فایل README به زبان‌های دیگری نیز در دسترس است:

- [English](https://github.com/expressjs/multer/blob/main/README.md) (انگلیسی)
- [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md) (اسپانیایی)
- [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md) (چینی)
- [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md) (کره ای)
- [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) (روسی)
- [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md) (ویتنامی)
- [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) (پرتغالی)

## نحوه نصب

</div>

```sh
npm install --save multer
```

<div dir="rtl">

## نحوه استفاده

مالتر (Multer) یک شیء `body` و یک شیء `file` یا `files` به شیء `request` اضافه می‌کند.
شیء `body` شامل مقادیر فیلدهای متنی فرم است و شیء `file` یا `files` شامل فایل‌هایی است که از طریق فرم آپلود شده‌اند.

مثال ساده از نحوه استفاده:

فراموش نکنید که در تگ `<form>` خود، ویژگی <span dir="ltr"> `enctype="multipart/form-data"` </span> را تنظیم کنید.

<div dir="ltr">

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
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
})

var uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
})
```

</div>

در صورتی که نیاز دارید فرمی با نوع `multipart` را که فقط شامل فیلدهای متنی است (و بدون فایل) پردازش کنید، باید از متد `()none.` استفاده کنید:

<div dir="ltr">

```javascript
var express = require('express')
var app = express()
var multer  = require('multer')
var upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body contains the text fields
})
```

در اینجا مثالی از نحوه استفاده از Multer در یک فرم HTML آورده شده است

به ویژگی‌های <span dir="ltr"> `enctype="multipart/form-data"` </span> و
<span dir="ltr"> `name="uploaded_file"` </span> توجه ویژه داشته باشید:

```HTML
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

سپس در فایل JavaScript خود، باید این خطوط را اضافه کنید تا به هر دو یعنی فایل و بدنه‌ی فرم دسترسی داشته باشید.
نکته‌ی مهم این است که باید از مقدار ویژگی `name` در فرم HTML دقیقاً در تابع `upload` نیز استفاده کنید. این کار به Multer می‌گوید که در کدام فیلد درخواست به دنبال فایل‌ها بگردد.

اگر این فیلدها در فرم HTML و در سمت سرور یکسان نباشند، فرآیند آپلود با شکست مواجه خواهد شد.

```js
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file is the name of your file in the form above, here 'uploaded_file'
  // req.body will hold the text fields, if there were any
  console.log(req.file, req.body)
});
```

</div>

## API

### اطلاعات فایل

هر فایل شامل اطلاعات زیر است:

کلید | توضیحات | یادداشت
--- | --- | ---
`fieldname` | نام فیلدی که در فرم مشخص شده است |
`originalname` | نام فایل روی کامپیوتر کاربر |
`encoding` | نوع کدگذاری  فایل|
`mimetype` | نوع MIME فایل |
`size` | اندازه فایل به بایت |
`destination` | پوشه‌ای که فایل در آن ذخیره شده است | `ذخیره‌سازی روی دیسک` (`DiskStorage`)
`filename` | نام فایل در مقصد (محل ذخیره‌سازی) ( `destination` ) | `ذخیره‌سازی روی دیسک` (`DiskStorage`)
`path` | مسیر کامل فایل آپلود شده | `ذخیره‌سازی روی دیسک` (`DiskStorage`)
`buffer` | یک بافر  شامل کل محتوای فایل| `ذخیره سازی در حافظه رم` (`MemoryStorage`)

### `multer(opts)`

مالتر (Multer) یک شیء گزینه‌ها (options) را می‌پذیرد که ابتدایی‌ترین آن ویژگی `dest` است، که به Multer می‌گوید فایل‌ها را کجا آپلود کند. در صورتی که شیء گزینه‌ها را ارائه ندهید، فایل‌ها در حافظه نگه داشته می‌شوند و هرگز روی دیسک نوشته نمی‌شوند.

به طور پیش‌فرض، Multer نام فایل‌ها را تغییر می‌دهد تا از تشابه نام‌ها جلوگیری کند. این تابع تغییر نام می‌تواند بر اساس نیازهای شما سفارشی‌سازی شود.

گزینه‌های زیر از جمله گزینه‌هایی هستند که می‌توانند به Multer ارسال شوند:

کلید | توضیحات
--- | ---
`dest` یا `storage` | محل ذخیره‌سازی فایل‌ها
`fileFilter` | تابعی برای کنترل اینکه کدام فایل‌ها پذیرفته شوند
`limits` | محدودیت های داده های آپلود شده
`preservePath` | نگه‌داشتن مسیر کامل فایل‌ها به جای فقط نام پایه (نام فایل بدون مسیر)

در یک اپلیکیشن وب معمولی، معمولاً فقط گزینه‌ی `dest` لازم است و به شکل زیر پیکربندی می‌شود:

<div dir='ltr'>

```javascript
var upload = multer({ dest: 'uploads/' })
```

</div>

اگر می‌خواهید کنترل بیشتری روی عملیات آپلود داشته باشید، بهتر است به جای استفاده از `dest` از گزینه‌ی `storage` استفاده کنید.

مالتر به طور پیش‌فرض دو موتور ذخیره‌سازی ارائه می‌دهد:

- **DiskStorage** (ذخیره‌سازی روی دیسک)
- **MemoryStorage** (ذخیره‌سازی در حافظه)

علاوه بر این، موتورهای ذخیره‌سازی بیشتری نیز توسط توسعه‌دهندگان ثالث در دسترس هستند.

#### `.single(fieldname)`

یک فایل با نام فیلد fieldname را دریافت می‌کند.  تک فایل دریافت شده داخل `req.file` ذخیره میشود

#### `.array(fieldname[, maxCount])`

یک آرایه از فایل‌ها را دریافت می‌کند که همگی نام فیلدشان `fieldname` است. در صورت مشخص بودن `maxCount`، در صورت آپلود بیش از این تعداد فایل، خطا ایجاد می‌شود. آرایه فایل‌ها در `req.files` ذخیره می‌شود.

#### `.fields(fields)`

چندین فایل با نام‌های مختلف را دریافت می‌کند که در آرایه‌ای به نام `fields` مشخص شده‌اند. یک شیء شامل آرایه‌ای از فایل‌ها در `req.files` ذخیره خواهد شد.

آرایه `fields` باید شامل اشیائی باشد که هر کدام دارای `name` و به‌طور اختیاری `maxCount` هستند.
مثال:

<div dir='ltr'>

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

</div>

#### `.none()`

فقط فیلدهای متنی را قبول می‌کند. اگر هر فایلی آپلود شود، با کد خطای `"LIMIT_UNEXPECTED_FILE"` مواجه خواهید شد.

#### `.any()`

تمام فایل‌هایی که از طریق درخواست ارسال می‌شوند را قبول می‌کند. آرایه‌ای از فایل‌ها در ‍`req.files` ذخیره خواهد شد.

**هشدار:** همیشه مطمئن شوید که فایل‌هایی که کاربر آپلود می‌کند را به درستی مدیریت می‌کنید. هرگز Multer را به‌صورت یک میان‌افزار (middleware) سراسری (global) اضافه نکنید، زیرا ممکن است یک کاربر مخرب فایل‌هایی را به مسیرهایی ارسال کند که شما انتظار نداشته‌اید.
این تابع را فقط در مسیرهایی استفاده کنید که فایل‌های آپلود شده را به درستی پردازش می‌کنید.

### `storage`

#### `DiskStorage`

موتور ذخیره‌سازی روی دیسک (Disk Storage) کنترل کامل را در اختیار شما قرار می‌دهد تا فایل‌ها را روی دیسک ذخیره کنید.

<div dir='ltr'>

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

</div>

دو گزینه موجود است: `destination` و `filename`. هر دو تابع هستند که مشخص می‌کنند فایل‌ها کجا ذخیره شوند.

گزینه `destination` تعیین می‌کند که فایل‌های آپلود شده در کدام پوشه ذخیره شوند. این مقدار می‌تواند به صورت رشته (مثلاً `'/tmp/uploads'`) نیز داده شود. اگر مقصدی تعیین نشود، پوشه پیش‌فرض سیستم‌عامل برای فایل‌های موقت استفاده خواهد شد.

**یادداشت:** وقتی که `destination` را به صورت یک تابع تعریف می‌کنید، مسئولیت ایجاد پوشه بر عهده‌ی شماست. اما اگر `destination` را به صورت یک رشته (string) بدهید، Multer به صورت خودکار اطمینان حاصل می‌کند که پوشه مورد نظر ایجاد شود.

گزینه‌ی `filename` برای تعیین نام فایل درون پوشه استفاده می‌شود. اگر نام فایل مشخص نشود، به هر فایل یک نام تصادفی بدون پسوند اختصاص داده خواهد شد.

**یادداشت:** مالتر (Multer) پسوند فایل را به صورت خودکار اضافه نمی‌کند، بنابراین تابع شما باید نام فایل را همراه با پسوند کامل آن برگرداند.

هر تابع، هم شیء درخواست (`req`) و هم اطلاعاتی درباره فایل (`file`) را دریافت می‌کند تا در تصمیم‌گیری به شما کمک کند.

توجه داشته باشید که ممکن است `req.body` هنوز به‌طور کامل پر نشده باشد. این موضوع بستگی به ترتیب ارسال فیلدها و فایل‌ها توسط کلاینت به سرور دارد.

برای درک نحوه‌ی فراخوانی تابع بازگشتی (callback) که نیاز است مقدار null به عنوان پارامتر اول آن ارسال شود،
[به مکانیزم مدیریت خطا در Node.js مراجعه کنید](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

موتور ذخیره‌سازی در حافظه رم (Memory Storage) فایل‌ها را به صورت شیءهای Buffer در رم  نگه می‌دارد. این موتور هیچ گزینه‌ای برای پیکربندی ندارد.

<div dir='ltr'>

```javascript
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
```

</div>

هنگامی که از حافظه (Memory Storage) استفاده می‌کنید، اطلاعات فایل شامل فیلدی به نام `buffer` خواهد بود که کل محتوای فایل را در قالب یک بافر (Buffer) در خود نگه می‌دارد.

**هشدار**: آپلود فایل‌های بسیار بزرگ، یا تعداد زیادی فایل‌های نسبتاً کوچک با سرعت بالا، می‌تواند باعث پر شدن حافظه‌ی برنامه شما شود وقتی که از حافظه (Memory Storage) استفاده می‌کنید.

### `limits`

یک شیء که محدودیت‌های اندازه برای ویژگی‌های اختیاری زیر را مشخص می‌کند. Multer این شیء را مستقیماً به Busboy ارسال می‌کند و جزئیات هر ویژگی را می‌توانید در  مربوط به [صفحه busboy's](https://github.com/mscdex/busboy#busboy-methods)
مشاهده کنید.

مقادیر عدد صحیح (integer) زیر قابل استفاده هستند:

کلید | توضیحات | مقدار پیشفرض
--- | --- | ---
`fieldNameSize` | حداکثر اندازه نام فیلد | 100 بايت
`fieldSize` | حداکثر اندازه مقدار فیلد (بر حسب بایت) | 1 مگابایت
`fields` |  تعداد فیلدهای غیرفایلی |  بی نهایت
`fileSize` | برای فرم‌های چندبخشی (multipart)، حداکثر اندازه فایل (بر حسب بایت) | بی نهایت
`files` | برای فرم‌های چندبخشی (multipart)، حداکثر تعداد فیلدهای فایل | بی نهایت
`parts` | برای فرم‌های چندبخشی (multipart)، حداکثر تعداد بخش‌ها (فیلدها + فایل‌ها) | بی نهایت
`headerPairs` | برای فرم‌های چندبخشی (multipart)، حداکثر تعداد جفت‌های کلید=>مقدار هدر که باید تجزیه شوند | 2000

مشخص کردن محدودیت‌ها می‌تواند به محافظت از سایت شما در برابر حملات اختلال در سرویس (DoS) کمک کند.

### `fileFilter`

برای کنترل اینکه کدام فایل‌ها باید آپلود شوند و کدام‌ها رد شوند، این مقدار را به یک تابع اختصاص دهید. ساختار تابع باید به صورت زیر باشد:

<div dir='ltr'>

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

</div>

## مدیریت خطا

وقتی که Multer با خطا مواجه شود، آن خطا را به Express واگذار می‌کند. شما می‌توانید با استفاده از کد زیر یک صفحه خطای مناسب نمایش دهید:
[روش استاندارد در Express](http://expressjs.com/guide/error-handling.html).

اگر می‌خواهید خطاهای مربوط به Multer را به‌طور خاص مدیریت کنید، می‌توانید خودتان تابع میان‌افزار (middleware) را صدا بزنید. همچنین، اگر بخواهید [فقط خطای های Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js) را بررسی کنید، می‌توانید از کلاس `MulterError` استفاده کنید که به شیء `multer` متصل است (مثلاً با بررسی `err instanceof multer.MulterError`).

<div dir='ltr'>

```javascript
var multer = require('multer')
var upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
    } else if (err) {
      // An unknown error occurred when uploading.
    }

    // Everything went fine.
  })
})
```

</div>

## موتور ذخیره‌سازی سفارشی

برای اطلاعات درباره نحوه ساخت موتور ذخیره‌سازی سفارشی، به بخش [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md) مراجعه کنید.

## لایسنس

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
