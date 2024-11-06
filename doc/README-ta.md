# Multer [![Build Status](https://badgen.net/github/checks/expressjs/multer/master?label=ci)](https://github.com/expressjs/multer/actions/workflows/ci.yml) [![Test Coverage](https://badgen.net/coveralls/c/github/expressjs/multer/master)](https://coveralls.io/r/expressjs/multer?branch=master) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer என்பது multipart/form-data செயலிகளை கையாளும் Node.js மிடில்வேர் ஆகும், இது முக்கியமாக கோப்புகளைப் பதிவேற்றுவதற்காகப் பயன்படுத்தப்படுகிறது.
அதிக செயல்திறனை வழங்குவதற்காக இது [busboy](https://github.com/mscdex/busboy) மீது எழுதியுள்ளது.

**குறிப்பு**: multipart/form-data அல்லாத எந்தப் படிவத்தையும் Multer செயலாக்காது.

## மொழிபெயர்ப்புகள்

இந்த README மற்ற மொழிகளில் கிடைக்கிறது:

- [العربية](https://github.com/expressjs/multer/blob/master/doc/README-ar.md) (அரபிக்)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (ஸ்பானிஷ்)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (சீனம்)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (கொரியன்)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (ரஷ்யன்)
- [Việt Nam](https://github.com/expressjs/multer/blob/master/doc/README-vi.md) (வியட்நாம்)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (போர்ச்சுகீஸ் பிரேசில்)
- [Français](https://github.com/expressjs/multer/blob/master/doc/README-fr.md) (பிரஞ்சு)
- [O'zbek tili](https://github.com/expressjs/multer/blob/master/doc/README-uz.md) (உஸ்பெக்)

## நிறுவதல்

```sh
$ npm install --save multer
```

## பயன்பாடு

Multer, request பொருளுக்கு `body` object மற்றும் `file` அல்லது `files` object ஐ சேர்க்கிறது. `body` object, படிவத்தின் உரை புலங்களின் மதிப்புகளை கொண்டுள்ளது, மற்றும் `file` அல்லது `files` object, படிவத்தின் மூலம் பதிவேற்றப்பட்ட கோப்புகளை கொண்டுள்ளது.

அடிப்படை பயன்பாட்டு உதாரணம்:

படிவத்தை உருவாக்கும்போது, கோப்புகளைப் பதிவேற்றுவது போன்ற செயல்களுக்காக `enctype="multipart/form-data"` ஐ குறிப்பிடுவது அவசியம். இது படிவத்தில் உள்ள தரவுகளை சரியாக அனுப்புவதற்கும் கோப்புகளை பதிவேற்றுவதற்கும் உதவுகிறது.

```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" />
</form>
```

```javascript
const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const app = express();

app.post("/profile", upload.single("avatar"), function (req, res, next) {
  // req.file என்பது `avatar` கோப்பாகும்
  // req.body படிவத்தில் உள்ள உரை புலங்களின் மதிப்புகளை உள்ளடக்கும், அவை இருந்தால்
});

app.post(
  "/photos/upload",
  upload.array("photos", 12),
  function (req, res, next) {
    // req.files என்பது photos கோப்புகளின் வரிசை `array` ஆகும்.
    // req.body will contain the text fields, if there were any
  }
);

const cpUpload = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "gallery", maxCount: 8 },
]);
app.post("/cool-profile", cpUpload, function (req, res, next) {
  // req.files என்பது ஒரு object (String -> Array) ஆகும், இதில் fieldname என்பது விசையாகும், மற்றும் மதிப்பு கோப்புகளின் வரிசை (array) ஆக இருக்கும்
  // // உதாரணம்:
  // req.files['avatar'][0] -> file
  // req.files['gallery'] -> array
  // // req.body என்பது படிவத்தில் உள்ள உரை புலங்களின் மதிப்புகளை உள்ளடக்கும், அவை இருந்தால்.
});
```

உரையை மட்டும் உள்ளடக்கிய multipart படிவத்தை கையாள வேண்டியிருந்தால்,
நீங்கள் `.none()` முறையைப் பயன்படுத்த வேண்டும்:

```javascript
const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer();

app.post("/profile", upload.none(), function (req, res, next) {
  // req.body என்பது உரை புலங்களைக் கொண்டுள்ளது.
});
```

இங்கே multer ஐ HTML படிவத்தில் எப்படி பயன்படுத்துவது என்பதற்கான ஒரு உதாரணம் உள்ளது. `enctype="multipart/form-data"` மற்றும் `name="uploaded_file"` புலங்களுக்கான முக்கியக் குறிப்பு:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file" />
    <input
      type="text"
      class="form-control"
      placeholder="Number of speakers"
      name="nspeakers"
    />
    <input type="submit" value="Get me the stats!" class="btn btn-default" />
  </div>
</form>
```

பிறகு, உங்கள் JavaScript கோப்பில் நீங்கள் இந்த வரிகளைக் கொண்டு கோப்பையும் உட்கார்ந்த தரவையும் அணுக வேண்டும்.
உங்கள் பதிவேற்ற செயலியில் படிவத்தின் `name` புலத்தின் மதிப்பை பயன்படுத்துவது முக்கியம்.
இது multer ஐ அறிவிக்கின்றது, எந்த புலத்தில் கோப்புகளை தேட வேண்டும் என்பதை. இந்த புலங்கள் HTML படிவத்தில் மற்றும் உங்கள் சர்வரிலுள்ளவை ஒரே மாதிரியானவை இல்லையெனில், உங்கள் பதிவேற்றம் தோல்வி அடையும்:

```javascript
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
app.post("/stats", upload.single("uploaded_file"), function (req, res) {
  // req.file என்பது உங்கள் படிவத்தில் கோப்பின் பெயர் ஆகும், இங்கு 'uploaded_file'
  // req.body என்பது உரை புலங்களை அடுக்கி வைக்கும், இருந்தால்
  console.log(req.file, req.body);
});
```

## API

### கோப்பு தகவல்

ஒவ்வொரு கோப்பிலும் பின்வரும் தகவல்கள் உள்ளன:

| முக்கியம்      | விளக்கம்                                | குறிப்பு        |
| -------------- | --------------------------------------- | --------------- |
| `fieldname`    | படிவத்தில் குறிப்பிடப்பட்ட புலம்        |
| `originalname` | பயனரின் கணினியில் கோப்பின் பெயர்        |
| `encoding`     | கோப்பின் குறியீடு வகை                   |
| `mimetype`     | கோப்பின் Mime வகை                       |
| `size`         | கோப்பின் அளவு (பைட்டுகளில்)             |
| `destination`  | கோப்பு சேமிக்கப்பட்ட கோப்புறையின் பெயர் | `DiskStorage`   |
| `filename`     | `destination` உள்ள கோப்பின் பெயர்       | `DiskStorage`   |
| `path`         | பதிவேற்றப்பட்ட கோப்பின் முழு பாதை       | `DiskStorage`   |
| `buffer`       | முழு கோப்பின் `Buffer`                  | `MemoryStorage` |

### `multer(opts)`

Multer ஒரு விருப்பங்கள் பொருளை ஏற்றுக்கொள்கிறது, அதில் மிக அடிப்படையானது `dest` சொத்து ஆகும்,
இது Multer க்கு கோப்புகளை எங்கு பதிவேற்ற வேண்டும் என்பதை குறிப்பிடுகிறது.
நீங்கள் விருப்பங்கள் பொருளை தவிர்த்தால், கோப்புகள் நினைவகத்தில் மட்டுமே வைக்கப்படும் மற்றும் படியில் எழுதப்படாது.

இயல்பாக, Multer கோப்புகளின் பெயர்களை மாற்றி ஒத்த பெயர் முரண்பாடுகளைத் தவிர்க்கும். பெயர் மாற்றும் செயல்பாட்டை உங்கள் தேவைகளுக்கு ஏற்ப தனிப்பயனாக்கலாம்.

கீழே, Multer க்கு அனுப்பக்கூடிய விருப்பங்கள் கொடுக்கப்பட்டுள்ளன.

| முக்கியம்               | விளக்கம்                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| `dest` அல்லது `storage` | கோப்புகளை எங்கு சேமிக்க வேண்டும்                                  |
| `fileFilter`            | ஏற்கப்படும் கோப்புகளை நிர்வகிக்கும் செயல்பாடு                     |
| `limits`                | பதிவேற்றப்பட்ட தரவுகளின் வரம்பு                                   |
| `preservePath`          | கோப்புகளின் முழு பாதையை வைத்து வைக்க, அடிப்படை பெயரை மட்டும் அல்ல |

ஒரு சராசரி வலை பயன்பாட்டில், `dest` மட்டுமே தேவையானது, மற்றும் பின்வருமாறு காட்சிப்படுத்தப்பட்டுள்ள உதாரணம் போல உள்ளமைக்கப்படலாம்.

```javascript
const upload = multer({ dest: "uploads/" });
```

நீங்கள் உங்கள் பதிவேற்றங்களை மேலாண்மை செய்ய விரும்பினால், `dest` ஐவிட `storage` விருப்பத்தை பயன்படுத்த வேண்டும். Multer, `DiskStorage` மற்றும் `MemoryStorage` என இரண்டு சேமிப்பு இயந்திரங்களை கொண்டு வருகிறது; மேலும் சில மூன்றாம் தரப்பினர் மூலம் சேர்க்கப்பட்ட சேமிப்பு இயந்திரங்களும் கிடைக்கின்றன.

#### `.single(fieldname)`

`fieldname` என்ற பெயரில் ஒரு கோப்பை ஏற்கவும். அந்த ஒரே கோப்பு `req.file` இல் சேமிக்கப்படும்.

#### `.array(fieldname[, maxCount])`

`fieldname` என்ற பெயரில் கோப்புகளின் வரிசையை ஏற்கவும். விருப்பமாக, `maxCount` கோப்புகளிலிருந்து அதிகமாக பதிவேற்றம் செய்தால் பிழை உண்டாக்கவும். கோப்புகளின் வரிசை `req.files` இல் சேமிக்கப்படும்.

#### `.fields(fields)`

`fields` மூலம் குறிப்பிடப்பட்ட கோப்புகளின் கலவையை ஏற்கவும். கோப்புகளின் வரிசைகளைக் கொண்ட ஒரு பொருள் `req.files` இல் சேமிக்கப்படும்.

`fields` என்பது `name` மற்றும் விருப்பமாக `maxCount` கொண்ட பொருட்கள் உள்ள வரிசையாக இருக்க வேண்டும்.  
உதாரணம்:

```javascript
[
  { name: "avatar", maxCount: 1 },
  { name: "gallery", maxCount: 8 },
];
```

#### `.none()`

வாங்கிய புலங்களில் மட்டும் உரையை ஏற்கவும். ஏதேனும் கோப்பு பதிவேற்றம் செய்யப்படும் பட்சத்தில், "LIMIT_UNEXPECTED_FILE" குறியீடு கொண்ட பிழை வெளியிடப்படும்.

#### `.any()`

அனைத்து கோப்புகளையும் ஏற்கின்றது, அவை எந்த வகையில் வரும்போதும். கோப்புகளின் வரிசை `req.files` இல் சேமிக்கப்படும்.

### `storage`

#### `DiskStorage`

டிஸ்க் சேமிப்பு இயந்திரம் கோப்புகளை டிஸ்கில் சேமிப்பதற்கான முழு கட்டுப்பாட்டை வழங்குகிறது.

```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp/my-uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });
```

இரண்டு விருப்பங்கள் கிடைக்கின்றன: `destination` மற்றும் `filename`. இவை இரண்டும் கோப்பை எங்கு சேமிப்பது என்பது தீர்மானிக்கும் செயல்பாடுகள் ஆகும்.

`destination` என்பது பதிவேற்றப்பட்ட கோப்புகள் எந்த கோப்புறையில் சேமிக்கப்பட வேண்டும் என்பதைக் தீர்மானிக்க பயன்படுத்தப்படுகிறது. இதை ஒரு `string` ஆகவும் (உதாரணமாக, `'/tmp/uploads'`) கொடுக்க முடியும். `destination` வழங்கப்படாதபோது, இயங்கு முறை அமைப்பின் சரியான கோப்பு பணிகளுக்கான இயல்புநிலை கோப்புறை பயன்படுத்தப்படுகிறது.

**குறிப்பு:** நீங்கள் `destination` ஐ செயல்பாடாக வழங்கும் போது அந்த கோப்புறையை உருவாக்குவதற்கான பொறுப்பு உங்களுக்கே இருக்கும். ஒரு `string` ஆக வழங்கினால், multer அதற்கான கோப்புறையை உங்களுக்காக உருவாக்கி கொடுக்கும்.

`filename` என்பது கோப்புறையின் உள்ளே கோப்பின் பெயர் எவ்வாறு இருக்க வேண்டும் என்பதைக் தீர்மானிக்க பயன்படுத்தப்படுகிறது. `filename` வழங்கப்படாவிட்டால், ஒவ்வொரு கோப்புக்கும் ஒரு புதிய பெயர் உருவாக்கப்படும், இது கோப்பு விரிவாக்கத்தை உள்ளடக்காது.

**குறிப்பு:** Multer உங்களுக்காக எந்த கோப்பு விரிவாக்கத்தையும் சேர்க்காது. உங்கள் செயல்பாடு கோப்பின் பெயரை முழுமையான கோப்பு விரிவாக்கத்துடன் திருப்பிச் சேர்க்க வேண்டும்.

ஒவ்வொரு செயல்பாட்டுக்கும் கேள்வி (`req`) மற்றும் கோப்புக்கு 관한 சில தகவல்கள் (`file`) அனுப்பப்படுகின்றன, இது முடிவெடுக்க உதவுகிறது.

குறிப்பிடுக, `req.body` இன்னும் முழுமையாக நிரப்பப்படாமல் இருக்கக்கூடும். இது, கிளையண்ட் எவ்வாறு புலங்களையும் கோப்புகளையும் சர்வருக்கு அனுப்புவதைப் பொருத்து மாறும்.

காலை செயற்பாட்டின் அழைப்பின் நடைமுறையை புரிந்துகொள்ள, (முதல் பராமரிப்பாக `null` அனுப்ப வேண்டும்) [Node.js பிழை கையாளல்](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors) இன் வழிகாட்டுதலுக்கு அணுகவும்.

#### `MemoryStorage`

மெமரி சேமிப்பு இயந்திரம் கோப்புகளை மெமரியில் `Buffer` objects ஆக சேமிக்கின்றது. இதற்கு எந்த விருப்பங்களும் கிடையாது.

```javascript
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
```

மெமரி சேமிப்பை பயன்படுத்தும்போது, கோப்பு தகவல் முழுமையான கோப்பை உள்ளடக்கிய `buffer` என்ற புலத்தை கொண்டிருக்கும்.

**எச்சரிக்கை**: மிகவும் பெரிய கோப்புகளை பதிவேற்றுதல் அல்லது சாதாரண அளவிலான கோப்புகளை பல எடுப்புகளில் மிகவும் விரைவாக பதிவேற்றுதல், மெமரி சேமிப்பு பயன்படுத்தும் போது உங்கள் பயன்பாட்டின் மெமரி முடிவடையக்கூடும்.

### `limits`

இதன் மூலம் சில விருப்பமான பண்புகளின் அளவு வரம்புகளை விவரிக்கும் ஒரு object. Multer இந்த object ஐ நேரடியாக busboy க்கு அனுப்புகிறது, மேலும் இந்த பண்புகளின் விவரங்களை [busboy பக்கம்](https://github.com/mscdex/busboy#busboy-methods) பார்க்கலாம்.

கீழ்க்காணும் முழு எண்கள் கிடைக்கும்:

| முக்கியம்       | விளக்கம்                                                                 | இயல்பானது |
| --------------- | ------------------------------------------------------------------------ | --------- |
| `fieldNameSize` | அதிகபட்ச புலம் பெயர் அளவு                                                | 100 bytes |
| `fieldSize`     | அதிகபட்ச புல மதிப்பின் அளவு (in bytes)                                   | 1MB       |
| `fields`        | அதிகபட்ச எண்ணிக்கை குறைவான கோப்பல்லாத புலங்கள்                           | Infinity  |
| `fileSize`      | பங்கு கோப்புகள் எனும் படிவங்களுக்கான அதிகபட்ச கோப்பு அளவு (in bytes)     | Infinity  |
| `files`         | பங்கு கோப்புகள் எனும் படிவங்களுக்கான அதிகபட்ச கோப்பு புலங்கள்            | Infinity  |
| `parts`         | பங்கு கோப்புகள் எனும் படிவங்களுக்கான அதிகபட்ச பாகங்கள் (fields + files)  | Infinity  |
| `headerPairs`   | பங்கு கோப்புகள் எனும் படிவங்களுக்கான அதிகபட்ச தலைப்பின் key=>value pairs | 2000      |

வரம்புகளை குறிப்பிடுவதன் மூலம் உங்கள் தளத்தை நிராகரிப்பு சேவை (DoS - Denial of Service) தாக்குதல்களிலிருந்து பாதுகாப்பது உதவும்.

### `fileFilter`

இந்த முறை, எந்த கோப்புகள் பதிவேற்றப்பட வேண்டும் மற்றும் எந்த கோப்புகள் தவிர்க்கப்பட வேண்டும் என்பதை கட்டுப்படுத்த ஒரு செயல்பாட்டை அமைக்க பயன்படுத்தப்படுகிறது. செயல்பாடு பின்வருமாறு இருக்கும்:

```javascript
function fileFilter(req, file, cb) {
  // செயல்பாடு `cb` ஐ ஒரு boolean மதிப்புடன் அழைக்க வேண்டும்
  // அது கோப்பு ஏற்கப்பட வேண்டும் எனக் குறிக்கிறது

  // இந்த கோப்பை நிராகரிக்க `false` ஐ அனுப்புங்கள், இதுபோல:
  cb(null, false);

  // கோப்பை ஏற்க `true` ஐ அனுப்புங்கள், இதுபோல:
  cb(null, true);

  // ஏதாவது தவறானால் நீங்கள் எப்பொழுதும் ஒரு பிழையை அனுப்பலாம்:
  cb(new Error("I don't have a clue!"));
}
```


## பிழை கையாளல்

ஒரு பிழை ஏற்படும்போது, Multer அந்த பிழையை Express க்கு ஒப்படைக்கும். நீங்கள் [நிலையான Express முறையில்](http://expressjs.com/guide/error-handling.html) ஒரு அழகான பிழைப் பக்கம் காட்ட முடியும்.

நீங்கள் Multer இன் பிழைகளை தனியாக பிடிக்க விரும்பினால், நீங்கள் அந்த மிடில்வேரைப் பயன் படுத்தி அழைக்க முடியும். மேலும், நீங்கள் [Multer பிழைகளை மட்டும்](https://github.com/expressjs/multer/blob/master/lib/multer-error.js) பிடிக்க விரும்பினால், `multer` பொருளில் இணைக்கப்பட்டுள்ள `MulterError` வகுப்பைப் பயன்படுத்த முடியும் (உதாரணம்: `err instanceof multer.MulterError`).


```javascript
const multer = require('multer')
const upload = multer().single('avatar')

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

## தனிப்பயன் சேமிப்பு எஞ்சின்

உங்கள் சொந்த சேமிப்பு எஞ்சினை எப்படி உருவாக்குவது என்பதைப் பற்றி மேலும் அறிய [Multer சேமிப்பு எஞ்சின்](https://github.com/expressjs/multer/blob/master/StorageEngine.md) பக்கம் பார்க்கவும்.

## அனுமதி

[MIT](LICENSE)