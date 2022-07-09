# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

<div dir="rtl">

تعتبر Multer وسيط node.js لمعالجة `multipart/form-data`, والتي تُستخدم أساسًا لتحميل الملفات. تم بناء هذا الوسيط بالإعتماد على [busboy](https://github.com/mscdex/busboy) لأجل الحصول على أقصى قدر من الكفاءة.

**ملاحظة**: لن يقوم Multer بمعالجة أي شكل غير متعدد الأجزاء (`multipart/form-data`).


## الترجمات 

هذا الملف متاح أيضًا بلغات أخرى:

- [English](https://github.com/expressjs/multer/blob/master/README.md) (الإنجليزية)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (الإسبانية)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (الصينية)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (الكورية)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (الروسية)
- [Việt Nam](https://github.com/expressjs/multer/blob/master/doc/README-vi.md) (الفتنامية)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (البرتغالية)


## التنصيب

</div>

```sh
$ npm install --save multer
```

<div dir="rtl">

## الاستعمال

يضيف Multer كائن `body` وكائن `file` أو `files` إلى كائن `request`. يحتوي الكائن `body` على قيم مدخلات النص في الإستمارة ، بينما يحتوي الكائن `file` أو `files` على الملفات التي تم تحميلها عبر الإستمارة.

مثال على الاستخدام الأساسي:

لا تنسَ <span dir="ltr"> `enctype="multipart/form-data"` </span> في الإستمارة الخاص بك.

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

</div>

إذا احتجت لمعالجة إستمارة متعددة الأجزاء للنص فقط ، فيجب عليك استخدام الدالة `.none ()`:

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
</div>

## واجهة برمجة التطبيقات (API)

### معلومات الملف

كل ملف يحتوي على المعلومات التالية:

مفتاح | وصف | ملاحظة
--- | --- | ---
`fieldname` | اسم المُدخَل المحدد في الإستمارة | 
`originalname` | اسم الملف على كمبيوتر المستخدم | 
`encoding` | نوع تشفير الملف | 
`mimetype` | نوع  ملف ملحقات بريد إنترنت متعددة الأغراض ( MIME ) | 
`size` | حجم الملف بالبايت | 
`destination` | المجلد الذي تم حفظ الملف إليه | `تخزين على الاسطوانة` (`DiskStorage`)
`filename` | اسم الملف داخل "الوجهة" ( `destination` ) | `تخزين على الاسطوانة` (`DiskStorage`)
`path` | المسار الكامل للملف الذي تم تحميله | `تخزين على الاسطوانة` (`DiskStorage`)
`buffer` | "ذاكرة" (`Buffer`) للملف بأكمله | `تخزين على الذاكرة ` (`MemoryStorage`)


### `multer(opts)` 

يقبل Multer كائن الخيارات ، وأهمها خاصية `dest`، والتي تحدد مكان تحميل الملفات. في حال حذفت كائن الخيارات ، سيتم الاحتفاظ بالملفات في الذاكرة ولن تتم كتابتها مطلقًا على القرص.

بشكل افتراضي ، سيقوم Multer بإعادة تسمية الملفات لتجنب تعارض الأسماء. يمكن تخصيص وظيفة إعادة التسمية وفقا لاحتياجاتك.

فيما يلي الخيارات التي يمكن تمريرها إلى Multer:

مفتاح | وصف
--- | ---
`dest` أو `storage` | مكان لتخزين الملفات 
`fileFilter` | دالة للسيطرة على الملفات التي يتم قبولها
`limits` | حدود البيانات التي تم تحميلها 
`preservePath` | الاحتفظ بالمسار الكامل للملفات بدلاً من الاسم الأساسي 

في تطبيق ويب متوسط  ​​، قد تكون هناك حاجة  فقط إلى `dest`، وتكوينها كما هو موضح في
المثال التالي :

<div dir='ltr'>

```javascript
var upload = multer({ dest: 'uploads/' })
```

</div>

إذا كنت تريد مزيدًا من التحكم في عمليات التحميل ، فستحتاج إلى استخدام خيار `storage` بدلاً من `dest`. يأتي Multer مع محركات التخزين `DiskStorage` و` MemoryStorage` ؛ كما تتوفر المزيد من المحركات من أطراف ثالثة.

#### `.single(fieldname)`

قبول ملف واحد باسم `اسم-المُدخَل`. سيتم تخزين الملف في `req.file`.

#### `.array(fieldname[, maxCount])`

قبول مصفوفة من الملفات ، وكلها تحمل اسم `اسم-المُدخَل`. يظهر خطأ اختياريً إذا تم تحميل ملفات أكثر من `maxCount`. سيتم تخزين مصفوفة الملفات في `req.files`.

#### `.fields(fields)`

قبول مزيج من الملفات ، المحدد بواسطة `المدخلات`. سيتم تخزين كائن مع مصفوفات من الملفات في `req.files`.

يجب أن تكون `المدخلات` عبارة عن مصفوفة من الكائنات التي توفر بشكل اساسي `name` واختيارياً `maxCount`.
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

قبول المدخلات النصية فقط. في حالة رفع أي ملف ، سيتم إصدار خطأ بشيفرة "LIMIT \_UNEXPECTED \_FILE".

#### `.any()`

قبول جميع الملفات التي تأتي عبر السلك. سيتم تخزين مصفوفة من الملفات في `req.files`.

**تحذير:** تأكد من أنك تعالج دائمًا الملفات التي يقوم المستخدم بتحميلها. لا تقم أبداً بإضافة multer باعتبارها أداة وسيطة عامة ، حيث يمكن للمستخدم الضار تحميل الملفات إلى مسار غير متتوقع. استخدم هذه الدالة فقط على المسارات التي تتعامل فيها مع الملفات التي تم تحميلها.

### `storage`

#### `DiskStorage`

يمنحك محرك تخزين القرص التحكم الكامل في تخزين الملفات على القرص.

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

هناك خياران متاحان ، `destination` و `filename`. كلاهما يعملان على تحديد مكان تخزين الملف.

يتم استخدام `destination` لتحديد أي مجلد يجب تخزين الملفات المحملة. يمكن أيضًا إعطاء هذا كـ`سلسلة` (مثل `'/tmp/uploads'`). إذا لم يتم إعطاء `destination` ، فسيتم استخدام الدليل الافتراضي لنظام التشغيل للملفات المؤقتة.

**ملاحظة:** أنت مسؤول عن إنشاء الدليل عند توفر `destination` كدالة. عند المرور بسلسلة ، سوف يتأكد multer من إنشاء الدليل من أجلك.

يتم استخدام `اسم الملف` لتحديد ما يجب تسمية الملف داخل المجلد. إذا لم يتم تقديم `اسم الملف`، فسيتم إعطاء كل ملف اسمًا عشوائيًا لا يتضمن أي امتداد للملف.

**ملاحظة:** لن يقوم multer بإلحاق اي ملحق ملف لك، الدالة الخاص بك يجب أن تقوم بإرجاع اسم ملف كامل بملحق الملف.

يتم تمرير كل دالة من خلال الطلب (req`) وبعض المعلومات حول الملف (`file`) للمساعدة في اتخاذ القرار.

لاحظ أن `req.body` ربما لم يتم ملؤها بالكامل بعد. يعتمد ذلك على الترتيب الذي يقوم به العميل من خلال نقل المدخلات والملفات إلى الخادم.

#### `MemoryStorage`

يخزن محرك تخزين الذاكرة الملفات الموجودة في الذاكرة ككائنات `ذاكرة` (`Buffer`). ليس لديها أي خيارات.

<div dir='ltr'>

```javascript
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
```

</div>

عند استخدام ذاكرة التخزين ، ستحتوي معلومات الملف على مُدخَل يسمى `buffer` الذي يحتوي على الملف بأكمله.

**تحذير**: يمكن أن يؤدي تحميل ملفات كبيرة جدًا أو ملفات صغيرة نسبيًا بأعداد كبيرة و بسرعة كبيرة إلى نفاد ذاكرة التطبيق عند استخدام ذاكرة التخزين.

### `limits`

كائن يحدد حدود حجم الخصائص الاختيارية التالية. يقوم Multer بتمرير هذا الكائن إلى busboy مباشرة ، ويمكن العثور على تفاصيل الخصائص من خلال [صفحة busboy's](https://github.com/mscdex/busboy#busboy-methods).

تتوفر القيم الصحيحة التالية:

مفتاح | وصف | افتراضي
--- | --- | ---
`fieldNameSize` | الحد الأقصى لحجم اسم المُدخَل | 100 بايت
`fieldSize` | الحد الأقصى لحجم قيمة المُدخَل (بالبايت) | 1 ميغابايت
`fields` | الحد الأقصى لعدد المدخلات التى لا تعتبر من الملفات | ما لا نهاية
`fileSize` | حجم الملف الأقصى بالنسبة لإستمارة متعددة الأجزاء (بالبايت) | ما لا نهاية
`files` | الحد الأقصى لعدد المدخلات من نوع الملفات بالنسبة لإستمارة متعددة الأجزاء | ما لا نهاية
`parts` | الحد الأقصى لعدد الأجزاء (مدخلات + ملفات) بالنسبة لإستمارة متعددة الأجزاء | ما لا نهاية
`headerPairs` | الحد الأقصى لعدد أزواج الرأس (المفتاح => القيمة) المطلوب تحليلها بالنسبة لإستمارة متعددة الأجزاء | 2000

يمكن أن يساعد تحديد الحدود في حماية موقعك من هجمات حجب الخدمة (DoS).

### `fileFilter`

اضبط هذا على دالة للتحكم في الملفات التي ينبغي تحميلها وأي الملفات يجب تخطيها. يجب أن تبدو دالة كما يلي:

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

## معالجة الأخطاء

عند مواجهة خطأ ، سيقوم Multer بتفويض الخطأ إلى Express. يمكنك
عرض صفحة خطأ لطيفة باستخدام [طريقة Express القياسية](http://expressjs.com/guide/error-handling.html).

إذا كنت تريد إنتقاء الأخطاء والحصول على [أخطاء Multer فقط](https://github.com/expressjs/multer/blob/master/lib/multer-error.js)، فيمكنك نداء بدالة الوسيطة من قبل نفسك. أيضًا ، إذا كنت تريد التقاط أخطاء Multer فقط ، فيمكنك استخدام صنف `MulterError` المتصل بالكائن` multer` نفسه (على سبيل المثال `err instanceof multer.MulterError`).

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

## محرك التخزين الخاص بك

للحصول على معلومات حول كيفية إنشاء محرك التخزين الخاص بك ، راجع [محرك تخزين Multer](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## الترخيص

[MIT](LICENSE)
