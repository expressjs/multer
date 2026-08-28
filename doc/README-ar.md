# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

<div dir="rtl">

Multer هو وسيط (middleware) لـ node.js لمعالجة `multipart/form-data`، والتي تُستخدم في المقام الأول لرفع الملفات. وهو مبني فوق [busboy](https://github.com/mscdex/busboy) لتحقيق أقصى قدر من الكفاءة.

**ملاحظة**: لن يعالج Multer أي نموذج ليس متعدد الأجزاء (`multipart/form-data`).

## الترجمات

هذا الملف التعريفي متاح أيضًا بلغات أخرى:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | الإنجليزية      |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | الصينية (المبسطة) |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | الفرنسية        |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | اليابانية       |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | الإندونيسية |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | الكورية         |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | البرتغالية (البرازيل) |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | الروسية         |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | الإسبانية       |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | التاميلية       |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | الأوزبكية       |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | الفيتنامية      |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | التركية         |


## التثبيت

<div dir="ltr">

```sh
$ npm install multer
```

</div>

## الاستخدام

يضيف Multer كائن `body` وكائن `file` أو `files` إلى كائن `request`. يحتوي الكائن `body` على قيم الحقول النصية في النموذج، بينما يحتوي الكائن `file` أو `files` على الملفات المرفوعة عبر النموذج.

مثال على الاستخدام الأساسي:

لا تنسَ إضافة `enctype="multipart/form-data"` في النموذج الخاص بك.

<div dir="ltr">

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
  // req.file هو ملف `avatar`
  // req.body سيحتوي على الحقول النصية، إن وُجدت
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files هو مصفوفة من ملفات `photos`
  // req.body سيحتوي على الحقول النصية، إن وُجدت
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files هو كائن (String -> Array) حيث fieldname هو المفتاح، والقيمة هي مصفوفة من الملفات
  //
  // مثلاً
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body سيحتوي على الحقول النصية، إن وُجدت
})
```

</div>

إذا احتجت إلى معالجة نموذج متعدد الأجزاء يحتوي على نصوص فقط، فعليك استخدام الدالة `.none()`:

<div dir="ltr">

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body يحتوي على الحقول النصية
})
```

</div>

فيما يلي مثال على كيفية استخدام multer في نموذج HTML. انتبه جيدًا إلى الحقلين `enctype="multipart/form-data"` و `name="uploaded_file"`:

<div dir="ltr">

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

</div>

بعد ذلك، في ملف javascript الخاص بك ستضيف هذه الأسطر للوصول إلى الملف والجسم (body) معًا. من المهم أن تستخدم قيمة الحقل `name` من النموذج في دالة الرفع الخاصة بك. فهذا ما يخبر multer في أي حقل من الطلب ينبغي أن يبحث عن الملفات. إذا لم تكن هذه الحقول متطابقة في نموذج HTML وعلى الخادم، فستفشل عملية الرفع:

<div dir="ltr">

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file هو اسم ملفك في النموذج أعلاه، وهو هنا 'uploaded_file'
  // req.body سيحتوي على الحقول النصية، إن وُجدت
  console.log(req.file, req.body)
});
```

</div>



## واجهة برمجة التطبيقات (API)

### معلومات الملف

يحتوي كل ملف على المعلومات التالية:

المفتاح | الوصف | ملاحظة
--- | --- | ---
`fieldname` | اسم الحقل المحدد في النموذج |
`originalname` | اسم الملف على جهاز المستخدم، أو المسار الكامل عند تفعيل `preservePath: true` |
`encoding` | نوع ترميز الملف |
`mimetype` | نوع MIME للملف |
`size` | حجم الملف بالبايت |
`destination` | المجلد الذي حُفظ فيه الملف | `DiskStorage`
`filename` | اسم الملف داخل `destination` | `DiskStorage`
`path` | المسار الكامل للملف المرفوع | `DiskStorage`
`buffer` | كائن `Buffer` يحتوي على الملف بأكمله | `MemoryStorage`

### `multer(opts)`

يقبل Multer كائن خيارات، وأبسط هذه الخيارات هي الخاصية `dest` التي تخبر Multer بمكان رفع الملفات. في حال حذفت كائن الخيارات، ستُحفظ الملفات في الذاكرة ولن تُكتب على القرص أبدًا.

بشكل افتراضي، سيعيد Multer تسمية الملفات لتجنب تعارض الأسماء. ويمكن تخصيص دالة إعادة التسمية وفقًا لاحتياجاتك.

فيما يلي الخيارات التي يمكن تمريرها إلى Multer.

المفتاح | الوصف
--- | ---
`dest` أو `storage` | مكان تخزين الملفات
`fileFilter` | دالة للتحكم في الملفات التي يتم قبولها
`limits` | حدود البيانات المرفوعة
`preservePath` | الاحتفاظ بالمسار الكامل الذي يرسله العميل في `file.originalname` بدلاً من الاسم الأساسي فقط
`defParamCharset` | مجموعة الأحرف الافتراضية المستخدمة لقيم معاملات ترويسة الجزء (مثل اسم الملف) التي ليست معاملات موسّعة (أي التي لا تحتوي على مجموعة أحرف صريحة). الافتراضي: `'latin1'`

في تطبيق ويب عادي، قد لا تحتاج سوى إلى `dest`، مضبوطًا كما هو موضح في المثال التالي.

<div dir="ltr">

```javascript
const upload = multer({ dest: 'uploads/' })
```

</div>

عند تفعيل `preservePath`، يمرر Multer اسم الملف الوارد كما هو مع أي مقاطع مسار يقدمها العميل. ويُعرض ذلك في `file.originalname`؛ وهو لا يغير مجلد الوجهة، ولا ينشئ مجلدات، ولا ينقّي المسار نيابةً عنك. إن `file.originalname` يأتي دائمًا من العميل ويجب التعامل معه على أنه غير موثوق؛ ومع `preservePath` يحتوي إضافةً إلى ذلك على مقاطع المسار التي أرسلها العميل. قم بتطبيعه أو التحقق منه قبل استخدامه في دالة `filename` مخصصة أو في محرك تخزين.

إذا أردت مزيدًا من التحكم في عمليات الرفع، فستحتاج إلى استخدام الخيار `storage` بدلاً من `dest`. يأتي Multer مزودًا بمحركي التخزين `DiskStorage` و `MemoryStorage`؛ وتتوفر محركات أخرى من أطراف ثالثة.

#### `.single(fieldname)`

يقبل ملفًا واحدًا بالاسم `fieldname`. سيُخزَّن هذا الملف في `req.file`.

#### `.array(fieldname[, maxCount])`

يقبل مصفوفة من الملفات، جميعها بالاسم `fieldname`. ويمكنه اختياريًا إصدار خطأ إذا رُفع عدد من الملفات يزيد عن `maxCount`. ستُخزَّن مصفوفة الملفات في `req.files`.

#### `.fields(fields)`

يقبل مزيجًا من الملفات المحددة بواسطة `fields`. سيُخزَّن كائن يحتوي على مصفوفات من الملفات في `req.files`.

يجب أن يكون `fields` مصفوفة من الكائنات التي تحتوي على `name` واختياريًا `maxCount`.
مثال:

<div dir="ltr">

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

</div>

#### `.none()`

يقبل الحقول النصية فقط. إذا تم رفع أي ملف، فسيُصدر خطأ بالرمز "LIMIT\_UNEXPECTED\_FILE".

#### `.any()`

يقبل جميع الملفات الواردة عبر الشبكة. ستُخزَّن مصفوفة من الملفات في `req.files`.

**تحذير:** تأكد من أنك تعالج دائمًا الملفات التي يرفعها المستخدم. لا تضف multer أبدًا كوسيط عام، إذ يمكن لمستخدم خبيث رفع ملفات إلى مسار لم تتوقعه. استخدم هذه الدالة فقط في المسارات التي تعالج فيها الملفات المرفوعة.

### `storage`

#### `DiskStorage`

يمنحك محرك التخزين على القرص تحكمًا كاملاً في تخزين الملفات على القرص.

<div dir="ltr">

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

</div>

هناك خياران متاحان، `destination` و `filename`. وكلاهما دالتان تحددان مكان تخزين الملف.

يُستخدم `destination` لتحديد المجلد الذي ينبغي تخزين الملفات المرفوعة فيه. ويمكن أيضًا تمريره كـ `string` (مثل `'/tmp/uploads'`). إذا لم يُحدَّد `destination`، فسيُستخدم المجلد الافتراضي لنظام التشغيل الخاص بالملفات المؤقتة.

**ملاحظة:** أنت مسؤول عن إنشاء المجلد عند تمرير `destination` كدالة. أما عند تمرير سلسلة نصية، فسيتأكد multer من إنشاء المجلد نيابةً عنك.

يُستخدم `filename` لتحديد الاسم الذي سيحمله الملف داخل المجلد. إذا لم يُحدَّد `filename`، فسيُعطى كل ملف اسمًا عشوائيًا لا يتضمن أي امتداد.

**ملاحظة:** لن يضيف Multer أي امتداد للملف نيابةً عنك، بل يجب أن تُرجع دالتك اسم ملف كاملاً مع امتداده.

تُمرَّر إلى كل دالة كلٌّ من الطلب (`req`) وبعض المعلومات عن الملف (`file`) للمساعدة في اتخاذ القرار.

لاحظ أن `req.body` قد لا يكون قد اكتمل ملؤه بعد. فهذا يعتمد على الترتيب الذي يرسل به العميل الحقول والملفات إلى الخادم.

لفهم اصطلاح الاستدعاء المستخدم في دالة رد النداء (ضرورة تمرير null كمعامل أول)، راجع [معالجة الأخطاء في Node.js](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

يخزن محرك التخزين في الذاكرة الملفات في الذاكرة ككائنات `Buffer`. وليس له أي خيارات.

<div dir="ltr">

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

</div>

عند استخدام التخزين في الذاكرة، ستحتوي معلومات الملف على حقل يسمى `buffer` يحتوي على الملف بأكمله.

**تحذير**: قد يؤدي رفع ملفات كبيرة جدًا، أو ملفات صغيرة نسبيًا بأعداد كبيرة وبسرعة عالية، إلى نفاد ذاكرة تطبيقك عند استخدام التخزين في الذاكرة.

### `limits`

كائن يحدد حدود الحجم للخصائص الاختيارية التالية. يمرر Multer هذا الكائن إلى busboy مباشرةً، ويمكن العثور على تفاصيل الخصائص في [صفحة busboy](https://github.com/mscdex/busboy#exports).

تتوفر القيم الصحيحة التالية:

المفتاح | الوصف | الافتراضي
--- | --- | ---
`fieldNameSize` | الحد الأقصى لحجم اسم الحقل | Infinity
`fieldSize` | الحد الأقصى لحجم قيمة الحقل (بالبايت) | 1MB
`fields` | الحد الأقصى لعدد الحقول غير الملفية | Infinity
`fileSize` | للنماذج متعددة الأجزاء، الحد الأقصى لحجم الملف (بالبايت) | Infinity
`files` | للنماذج متعددة الأجزاء، الحد الأقصى لعدد حقول الملفات | Infinity
`parts` | للنماذج متعددة الأجزاء، الحد الأقصى لعدد الأجزاء (الحقول + الملفات) | Infinity
`headerPairs` | للنماذج متعددة الأجزاء، الحد الأقصى لعدد أزواج الترويسة (مفتاح=>قيمة) المطلوب تحليلها | 2000
`fieldNestingDepth` | الحد الأقصى لعدد مستويات التداخل في أسماء الحقول (مثلاً `a[b][c]` يحتوي على مستويين) | Infinity
`fieldArrayIndexLimit` | الحد الأقصى لفهرس المصفوفة الرقمي المقبول داخل اسم الحقل (مثلاً `a[3]` يستخدم الفهرس 3) | Infinity

يُفعَّل حد `parts` عندما يصل busboy إلى العدد المضبوط من الأجزاء، وليس فقط بعد تجاوز هذا العدد. إذا أردت السماح بعدد محدد بالضبط من الحقول والملفات، فاضبط `parts` على قيمة تزيد بواحد على الأقل عن ذلك المجموع.

يمكن أن يساعد تحديد الحدود في حماية موقعك من هجمات حجب الخدمة (DoS).

### `fileFilter`

اضبط هذا الخيار على دالة للتحكم في الملفات التي ينبغي رفعها وتلك التي ينبغي تخطيها. يجب أن تبدو الدالة كما يلي:

<div dir="ltr">

```javascript
function fileFilter (req, file, cb) {

  // يجب أن تستدعي الدالة `cb` بقيمة منطقية
  // للإشارة إلى ما إذا كان ينبغي قبول الملف

  // لرفض هذا الملف مرّر `false`، هكذا:
  cb(null, false)

  // لقبول الملف مرّر `true`، هكذا:
  cb(null, true)

  // يمكنك دائمًا تمرير خطأ إذا حدث شيء ما:
  cb(new Error('I don\'t have a clue!'))

}
```

</div>

## الأمان

يمكن أن يساعد تحديد [الحدود](#limits) في حماية موقعك من هجمات حجب الخدمة (DoS). يُوصى بالحدود التالية لمعظم التطبيقات:

- `fileSize` -- اضبطه على الحد الأقصى المتوقع لحجم الملف في حالة استخدامك
- `files` -- اضبطه على الحد الأقصى لعدد الملفات في كل طلب
- `fields` -- اضبطه على الحد الأقصى لعدد الحقول النصية في كل طلب
- `fieldNestingDepth` -- اضبطه على أدنى عمق تتطلبه أسماء حقولك (مثلاً `3` لـ `a[b][c]`)
- `fieldArrayIndexLimit` -- اضبطه على أكبر فهرس مصفوفة تتطلبه أسماء حقولك (مثلاً `100` لـ `a[99]`)

## معالجة الأخطاء

عند مواجهة خطأ، سيفوّض Multer الخطأ إلى Express. يمكنك عرض صفحة خطأ أنيقة باستخدام [الطريقة القياسية في Express](https://expressjs.com/en/guide/error-handling/).

إذا أردت التقاط الأخطاء الصادرة عن Multer تحديدًا، فيمكنك استدعاء دالة الوسيط بنفسك. كذلك، إذا أردت التقاط [أخطاء Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js) فقط، فيمكنك استخدام الصنف `MulterError` المرفق بكائن `multer` نفسه (مثلاً `err instanceof multer.MulterError`).

<div dir="ltr">

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // حدث خطأ من Multer أثناء الرفع.
    } else if (err) {
      // حدث خطأ غير معروف أثناء الرفع.
    }

    // سار كل شيء على ما يرام.
  })
})
```

</div>

## محرك تخزين مخصص

للحصول على معلومات حول كيفية بناء محرك التخزين الخاص بك، راجع [محرك تخزين Multer](https://github.com/expressjs/multer/blob/main/StorageEngine.md).

## الترخيص

[MIT](LICENSE)

</div>

[ci-image]: https://github.com/expressjs/multer/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/expressjs/multer/actions/workflows/ci.yml
[test-url]: https://coveralls.io/r/expressjs/multer?branch=main
[test-image]: https://badgen.net/coveralls/c/github/expressjs/multer/main
[npm-downloads-image]: https://badgen.net/npm/dm/multer
[npm-url]: https://npmjs.org/package/multer
[npm-version-image]: https://badgen.net/npm/v/multer
[ossf-scorecard-badge]: https://api.scorecard.dev/projects/github.com/expressjs/multer/badge
[ossf-scorecard-visualizer]: https://ossf.github.io/scorecard-visualizer/#/projects/github.com/expressjs/multer
