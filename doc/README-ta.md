# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer என்பது `multipart/form-data` ஐக் கையாள்வதற்கான ஒரு node.js மிடில்வேர் ஆகும்; இது முக்கியமாகக் கோப்புகளைப் பதிவேற்றுவதற்குப் பயன்படுத்தப்படுகிறது.
அதிகபட்ச செயல்திறனுக்காக இது [busboy](https://github.com/mscdex/busboy) மீது எழுதப்பட்டுள்ளது.

**குறிப்பு**: multipart அல்லாத (`multipart/form-data`) எந்தப் படிவத்தையும் Multer செயலாக்காது.

## மொழிபெயர்ப்புகள்

இந்த README பிற மொழிகளிலும் கிடைக்கிறது:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | ஆங்கிலம்         |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | அரபு            |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | சீனம் (எளிமைப்படுத்தப்பட்டது) |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | பிரெஞ்சு         |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | ஜப்பானியம்       |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | இந்தோனேசியம் |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | கொரியன்         |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | போர்த்துகீசியம் (பிரேசில்) |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | ரஷ்யன்          |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | ஸ்பானிஷ்        |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | உஸ்பெக்         |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | வியட்நாமியம்     |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | துருக்கியம்      |


## நிறுவல்

```sh
$ npm install multer
```

## பயன்பாடு

Multer ஆனது `request` பொருளில் ஒரு `body` பொருளையும், ஒரு `file` அல்லது `files` பொருளையும் சேர்க்கிறது. `body` பொருளில் படிவத்தின் உரைப் புலங்களின் மதிப்புகள் இருக்கும்; `file` அல்லது `files` பொருளில் படிவம் வழியாகப் பதிவேற்றப்பட்ட கோப்புகள் இருக்கும்.

அடிப்படைப் பயன்பாட்டு உதாரணம்:

உங்கள் படிவத்தில் `enctype="multipart/form-data"` ஐச் சேர்க்க மறக்காதீர்கள்.

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
  // req.file என்பது `avatar` கோப்பு
  // உரைப் புலங்கள் ஏதேனும் இருந்தால், அவை req.body இல் இருக்கும்
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files என்பது `photos` கோப்புகளின் வரிசை
  // உரைப் புலங்கள் ஏதேனும் இருந்தால், அவை req.body இல் இருக்கும்
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files என்பது ஒரு பொருள் (String -> Array); இதில் fieldname திறவுகோலாகவும், மதிப்பு கோப்புகளின் வரிசையாகவும் இருக்கும்
  //
  // எ.கா.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // உரைப் புலங்கள் ஏதேனும் இருந்தால், அவை req.body இல் இருக்கும்
})
```

உரை மட்டுமே கொண்ட multipart படிவத்தைக் கையாள வேண்டியிருந்தால், நீங்கள் `.none()` முறையைப் பயன்படுத்த வேண்டும்:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body இல் உரைப் புலங்கள் உள்ளன
})
```

HTML படிவத்தில் multer எவ்வாறு பயன்படுத்தப்படுகிறது என்பதற்கான ஒரு உதாரணம் இதோ. `enctype="multipart/form-data"` மற்றும் `name="uploaded_file"` புலங்களைக் குறிப்பாகக் கவனிக்கவும்:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

பிறகு, கோப்பையும் body ஐயும் அணுக, உங்கள் javascript கோப்பில் இந்த வரிகளைச் சேர்க்க வேண்டும். உங்கள் பதிவேற்றச் செயல்பாட்டில் படிவத்தில் உள்ள `name` புலத்தின் மதிப்பையே பயன்படுத்துவது முக்கியம். கோரிக்கையில் எந்தப் புலத்தில் கோப்புகளைத் தேட வேண்டும் என்பதை இது multer க்குத் தெரிவிக்கிறது. HTML படிவத்திலும் உங்கள் சர்வரிலும் இந்தப் புலங்கள் ஒரே மாதிரியாக இல்லையென்றால், உங்கள் பதிவேற்றம் தோல்வியடையும்:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file என்பது மேலே உள்ள படிவத்தில் உங்கள் கோப்பின் பெயர், இங்கே 'uploaded_file'
  // உரைப் புலங்கள் ஏதேனும் இருந்தால், அவை req.body இல் இருக்கும்
  console.log(req.file, req.body)
});
```



## API

### கோப்புத் தகவல்

ஒவ்வொரு கோப்பிலும் பின்வரும் தகவல்கள் உள்ளன:

திறவுகோல் | விளக்கம் | குறிப்பு
--- | --- | ---
`fieldname` | படிவத்தில் குறிப்பிடப்பட்ட புலப் பெயர் |
`originalname` | பயனரின் கணினியில் உள்ள கோப்பின் பெயர், அல்லது `preservePath: true` எனில் முழுப் பாதை |
`encoding` | கோப்பின் குறியாக்க (encoding) வகை |
`mimetype` | கோப்பின் Mime வகை |
`size` | கோப்பின் அளவு (பைட்டுகளில்) |
`destination` | கோப்பு சேமிக்கப்பட்ட கோப்புறை | `DiskStorage`
`filename` | `destination` க்குள் உள்ள கோப்பின் பெயர் | `DiskStorage`
`path` | பதிவேற்றப்பட்ட கோப்பின் முழுப் பாதை | `DiskStorage`
`buffer` | முழுக் கோப்பின் ஒரு `Buffer` | `MemoryStorage`

### `multer(opts)`

Multer ஒரு விருப்பங்கள் (options) பொருளை ஏற்றுக்கொள்கிறது; அதில் மிக அடிப்படையானது `dest`
பண்பு ஆகும், இது கோப்புகளை எங்கே பதிவேற்ற வேண்டும் என்பதை Multer க்குத் தெரிவிக்கிறது.
விருப்பங்கள் பொருளை நீங்கள் தவிர்த்தால், கோப்புகள் நினைவகத்திலேயே வைக்கப்படும்; வட்டில் ஒருபோதும் எழுதப்படாது.

பெயர் முரண்பாடுகளைத் தவிர்ப்பதற்காக, இயல்பாக Multer கோப்புகளை மறுபெயரிடும். மறுபெயரிடும்
செயல்பாட்டை உங்கள் தேவைகளுக்கு ஏற்பத் தனிப்பயனாக்கலாம்.

Multer க்கு அனுப்பக்கூடிய விருப்பங்கள் பின்வருமாறு.

திறவுகோல் | விளக்கம்
--- | ---
`dest` அல்லது `storage` | கோப்புகளை எங்கே சேமிக்க வேண்டும்
`fileFilter` | எந்தக் கோப்புகள் ஏற்கப்படும் என்பதைக் கட்டுப்படுத்தும் செயல்பாடு
`limits` | பதிவேற்றப்படும் தரவின் வரம்புகள்
`preservePath` | அடிப்படைப் பெயரை மட்டும் வைக்காமல், கிளையன்ட் வழங்கிய முழுப் பாதையை `file.originalname` இல் வைத்திருக்கவும்
`defParamCharset` | விரிவாக்கப்பட்ட அளவுருக்கள் (வெளிப்படையான charset ஐக் கொண்டவை) அல்லாத part header அளவுரு மதிப்புகளுக்கு (எ.கா. filename) பயன்படுத்த வேண்டிய இயல்புநிலை எழுத்துத் தொகுதி. இயல்புநிலை: `'latin1'`

ஒரு சராசரி வலைப் பயன்பாட்டில், `dest` மட்டுமே தேவைப்படலாம்; அதைப் பின்வரும் உதாரணத்தில்
காட்டியுள்ளபடி உள்ளமைக்கலாம்.

```javascript
const upload = multer({ dest: 'uploads/' })
```

`preservePath` இயக்கப்பட்டிருக்கும்போது, கிளையன்ட் வழங்கிய பாதைப் பகுதிகளுடன் சேர்த்து
உள்வரும் கோப்புப் பெயரை Multer அப்படியே கடத்துகிறது. இது `file.originalname` ஆக வெளிப்படுத்தப்படுகிறது;
இது இலக்குக் கோப்புறையை மாற்றாது, கோப்பகங்களை உருவாக்காது, பாதையை உங்களுக்காகச்
சுத்திகரிக்கவும் செய்யாது. `file.originalname` எப்போதும் கிளையன்ட் வழங்குவதே; அதை
நம்பத்தகாததாகவே கருத வேண்டும். `preservePath` உடன் அதில் கிளையன்ட் அனுப்பிய பாதைப்
பகுதிகளும் கூடுதலாக இருக்கும். தனிப்பயன் `filename` அல்லது சேமிப்பக இயந்திரத்தில் அதைப்
பயன்படுத்துவதற்கு முன் அதை இயல்பாக்கவும் அல்லது சரிபார்க்கவும்.

உங்கள் பதிவேற்றங்களின் மீது கூடுதல் கட்டுப்பாடு வேண்டுமெனில், `dest` க்குப் பதிலாக `storage`
விருப்பத்தைப் பயன்படுத்த வேண்டும். Multer உடன் `DiskStorage` மற்றும் `MemoryStorage` ஆகிய
சேமிப்பக இயந்திரங்கள் வருகின்றன; மேலும் பல இயந்திரங்கள் மூன்றாம் தரப்பினரிடமிருந்து கிடைக்கின்றன.

#### `.single(fieldname)`

`fieldname` என்ற பெயருடைய ஒரே ஒரு கோப்பை ஏற்கும். அந்த ஒற்றைக் கோப்பு `req.file` இல்
சேமிக்கப்படும்.

#### `.array(fieldname[, maxCount])`

`fieldname` என்ற பெயருடைய கோப்புகளின் வரிசையை (array) ஏற்கும். `maxCount` ஐ விட அதிகமான
கோப்புகள் பதிவேற்றப்பட்டால் விருப்பத்தின் பேரில் பிழையை எழுப்பும். கோப்புகளின் வரிசை
`req.files` இல் சேமிக்கப்படும்.

#### `.fields(fields)`

`fields` ஆல் குறிப்பிடப்பட்ட கோப்புகளின் கலவையை ஏற்கும். கோப்புகளின் வரிசைகளைக் கொண்ட ஒரு
பொருள் `req.files` இல் சேமிக்கப்படும்.

`fields` என்பது `name` மற்றும் விருப்பத்தேர்வாக `maxCount` கொண்ட பொருள்களின் வரிசையாக இருக்க வேண்டும்.
உதாரணம்:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

உரைப் புலங்களை மட்டுமே ஏற்கும். ஏதேனும் கோப்புப் பதிவேற்றம் செய்யப்பட்டால்,
"LIMIT\_UNEXPECTED\_FILE" குறியீட்டுடன் பிழை எழுப்பப்படும்.

#### `.any()`

வலையமைப்பு வழியாக வரும் அனைத்துக் கோப்புகளையும் ஏற்கும். கோப்புகளின் வரிசை
`req.files` இல் சேமிக்கப்படும்.

**எச்சரிக்கை:** பயனர் பதிவேற்றும் கோப்புகளை நீங்கள் எப்போதும் கையாள்கிறீர்கள் என்பதை உறுதிசெய்யுங்கள்.
multer ஐ ஒருபோதும் உலகளாவிய (global) மிடில்வேராகச் சேர்க்காதீர்கள்; ஏனெனில் தீங்கிழைக்கும் பயனர் ஒருவர்
நீங்கள் எதிர்பாராத ஒரு route க்குக் கோப்புகளைப் பதிவேற்றக்கூடும். பதிவேற்றப்பட்ட கோப்புகளை
நீங்கள் கையாளும் route களில் மட்டுமே இந்தச் செயல்பாட்டைப் பயன்படுத்துங்கள்.

### `storage`

#### `DiskStorage`

வட்டு சேமிப்பக இயந்திரம் (disk storage engine) கோப்புகளை வட்டில் சேமிப்பதில் உங்களுக்கு முழுக் கட்டுப்பாட்டை வழங்குகிறது.

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

`destination` மற்றும் `filename` என இரண்டு விருப்பங்கள் உள்ளன. இவை இரண்டும் கோப்பு எங்கே
சேமிக்கப்பட வேண்டும் என்பதைத் தீர்மானிக்கும் செயல்பாடுகள்.

பதிவேற்றப்பட்ட கோப்புகள் எந்தக் கோப்புறைக்குள் சேமிக்கப்பட வேண்டும் என்பதைத் தீர்மானிக்க
`destination` பயன்படுத்தப்படுகிறது. இதை ஒரு `string` ஆகவும் (எ.கா. `'/tmp/uploads'`) கொடுக்கலாம்.
`destination` கொடுக்கப்படாவிட்டால், தற்காலிகக் கோப்புகளுக்கான இயக்கு முறைமையின் இயல்புநிலைக்
கோப்பகம் பயன்படுத்தப்படும்.

**குறிப்பு:** `destination` ஐ ஒரு செயல்பாடாக வழங்கும்போது, கோப்பகத்தை உருவாக்கும் பொறுப்பு
உங்களுடையது. ஒரு string ஐ அனுப்பும்போது, கோப்பகம் உங்களுக்காக உருவாக்கப்படுவதை multer
உறுதிசெய்யும்.

கோப்புறைக்குள் கோப்புக்கு என்ன பெயர் இட வேண்டும் என்பதைத் தீர்மானிக்க `filename` பயன்படுத்தப்படுகிறது.
`filename` கொடுக்கப்படாவிட்டால், ஒவ்வொரு கோப்புக்கும் கோப்பு நீட்டிப்பு (extension) எதுவும் இல்லாத
ஒரு சீரற்ற (random) பெயர் வழங்கப்படும்.

**குறிப்பு:** Multer உங்களுக்காக எந்தக் கோப்பு நீட்டிப்பையும் சேர்க்காது; உங்கள் செயல்பாடு
கோப்பு நீட்டிப்புடன் கூடிய முழுமையான கோப்புப் பெயரைத் திருப்பித் தர வேண்டும்.

முடிவெடுக்க உதவும் வகையில், ஒவ்வொரு செயல்பாட்டிற்கும் கோரிக்கை (`req`) மற்றும் கோப்பைப் பற்றிய
சில தகவல்கள் (`file`) ஆகிய இரண்டும் அனுப்பப்படுகின்றன.

`req.body` இன்னும் முழுமையாக நிரப்பப்படாமல் இருக்கக்கூடும் என்பதைக் கவனிக்கவும். கிளையன்ட்
புலங்களையும் கோப்புகளையும் சர்வருக்கு அனுப்பும் வரிசையைப் பொறுத்து இது அமையும்.

callback இல் பயன்படுத்தப்படும் அழைப்பு மரபை (முதல் அளவுருவாக null ஐ அனுப்ப வேண்டியதை)
புரிந்துகொள்ள,
[Node.js பிழைக் கையாளுதல்](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors) ஐப் பார்க்கவும்

#### `MemoryStorage`

நினைவக சேமிப்பக இயந்திரம் (memory storage engine) கோப்புகளை `Buffer` பொருள்களாக நினைவகத்தில் சேமிக்கிறது.
இதற்கு எந்த விருப்பங்களும் இல்லை.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

நினைவக சேமிப்பகத்தைப் பயன்படுத்தும்போது, கோப்புத் தகவலில் முழுக் கோப்பையும் கொண்ட
`buffer` என்ற புலம் இருக்கும்.

**எச்சரிக்கை**: நினைவக சேமிப்பகம் பயன்படுத்தப்படும்போது, மிகப் பெரிய கோப்புகளை, அல்லது
ஒப்பீட்டளவில் சிறிய கோப்புகளை அதிக எண்ணிக்கையில் மிக விரைவாகப் பதிவேற்றுவது, உங்கள்
பயன்பாட்டின் நினைவகம் தீர்ந்துபோகக் காரணமாகலாம்.

### `limits`

பின்வரும் விருப்பத்தேர்வுப் பண்புகளின் அளவு வரம்புகளைக் குறிப்பிடும் ஒரு பொருள். Multer இந்தப் பொருளை நேரடியாக busboy க்கு அனுப்புகிறது; பண்புகளின் விவரங்களை [busboy இன் பக்கத்தில்](https://github.com/mscdex/busboy#exports) காணலாம்.

பின்வரும் முழு எண் மதிப்புகள் கிடைக்கின்றன:

திறவுகோல் | விளக்கம் | இயல்புநிலை
--- | --- | ---
`fieldNameSize` | புலப் பெயரின் அதிகபட்ச அளவு | Infinity
`fieldSize` | புல மதிப்பின் அதிகபட்ச அளவு (பைட்டுகளில்) | 1MB
`fields` | கோப்பு அல்லாத புலங்களின் அதிகபட்ச எண்ணிக்கை | Infinity
`fileSize` | multipart படிவங்களுக்கு, அதிகபட்சக் கோப்பு அளவு (பைட்டுகளில்) | Infinity
`files` | multipart படிவங்களுக்கு, கோப்புப் புலங்களின் அதிகபட்ச எண்ணிக்கை | Infinity
`parts` | multipart படிவங்களுக்கு, பகுதிகளின் (புலங்கள் + கோப்புகள்) அதிகபட்ச எண்ணிக்கை | Infinity
`headerPairs` | multipart படிவங்களுக்கு, பாகுபடுத்த வேண்டிய header key=>value இணைகளின் அதிகபட்ச எண்ணிக்கை | 2000
`fieldNestingDepth` | புலப் பெயர்களில் அனுமதிக்கப்படும் உள்ளடுக்கு (nesting) நிலைகளின் அதிகபட்ச எண்ணிக்கை (எ.கா. `a[b][c]` இல் 2 நிலைகள் உள்ளன) | Infinity
`fieldArrayIndexLimit` | புலப் பெயருக்குள் ஏற்கப்படும் அதிகபட்ச எண் வரிசைக் குறியீடு (array index) (எ.கா. `a[3]` குறியீடு 3 ஐப் பயன்படுத்துகிறது) | Infinity

உள்ளமைக்கப்பட்ட பகுதிகளின் எண்ணிக்கையை busboy அடையும்போதே `parts` வரம்பு தூண்டப்படுகிறது;
அந்த எண்ணிக்கை மீறப்பட்ட பிறகு மட்டுமல்ல. குறிப்பிட்ட சரியான எண்ணிக்கையிலான புலங்களையும்
கோப்புகளையும் அனுமதிக்க விரும்பினால், `parts` ஐ அந்த மொத்தத்தை விடக் குறைந்தது ஒன்று அதிகமாக அமைக்கவும்.

வரம்புகளைக் குறிப்பிடுவது, சேவை மறுப்பு (DoS) தாக்குதல்களிலிருந்து உங்கள் தளத்தைப் பாதுகாக்க உதவும்.

### `fileFilter`

எந்தக் கோப்புகள் பதிவேற்றப்பட வேண்டும், எவை தவிர்க்கப்பட வேண்டும் என்பதைக் கட்டுப்படுத்த
இதை ஒரு செயல்பாடாக அமைக்கவும். அந்தச் செயல்பாடு இப்படி இருக்க வேண்டும்:

```javascript
function fileFilter (req, file, cb) {

  // கோப்பை ஏற்க வேண்டுமா என்பதைக் குறிக்க, இந்தச் செயல்பாடு
  // ஒரு boolean மதிப்புடன் `cb` ஐ அழைக்க வேண்டும்

  // இந்தக் கோப்பை நிராகரிக்க `false` ஐ இப்படி அனுப்பவும்:
  cb(null, false)

  // கோப்பை ஏற்க `true` ஐ இப்படி அனுப்பவும்:
  cb(null, true)

  // ஏதேனும் தவறு நேர்ந்தால், எப்போதும் ஒரு பிழையை அனுப்பலாம்:
  cb(new Error('I don\'t have a clue!'))

}
```

## பாதுகாப்பு

[வரம்புகளைக்](#limits) குறிப்பிடுவது, சேவை மறுப்பு (DoS) தாக்குதல்களிலிருந்து உங்கள் தளத்தைப் பாதுகாக்க உதவும். பெரும்பாலான பயன்பாடுகளுக்குப் பின்வரும் வரம்புகள் பரிந்துரைக்கப்படுகின்றன:

- `fileSize` -- உங்கள் பயன்பாட்டுச் சூழலில் எதிர்பார்க்கப்படும் அதிகபட்சக் கோப்பு அளவுக்கு அமைக்கவும்
- `files` -- ஒரு கோரிக்கைக்கான அதிகபட்சக் கோப்புகளின் எண்ணிக்கைக்கு அமைக்கவும்
- `fields` -- ஒரு கோரிக்கைக்கான அதிகபட்ச உரைப் புலங்களின் எண்ணிக்கைக்கு அமைக்கவும்
- `fieldNestingDepth` -- உங்கள் புலப் பெயர்களுக்குத் தேவையான குறைந்தபட்ச ஆழத்திற்கு அமைக்கவும் (எ.கா. `a[b][c]` க்கு `3`)
- `fieldArrayIndexLimit` -- உங்கள் புலப் பெயர்களுக்குத் தேவையான மிகப்பெரிய வரிசைக் குறியீட்டிற்கு அமைக்கவும் (எ.கா. `a[99]` க்கு `100`)

## பிழைக் கையாளுதல்

பிழை ஏற்படும்போது, Multer அந்தப் பிழையை Express க்கு ஒப்படைக்கும். [வழக்கமான express முறையைப்](https://expressjs.com/en/guide/error-handling/)
பயன்படுத்தி நீங்கள் ஒரு நல்ல பிழைப் பக்கத்தைக் காட்டலாம்.

Multer இலிருந்து வரும் பிழைகளைக் குறிப்பாகப் பிடிக்க விரும்பினால், மிடில்வேர் செயல்பாட்டை
நீங்களே அழைக்கலாம். மேலும், [Multer பிழைகளை](https://github.com/expressjs/multer/blob/main/lib/multer-error.js) மட்டும் பிடிக்க விரும்பினால், `multer` பொருளிலேயே இணைக்கப்பட்டுள்ள `MulterError` வகுப்பைப் (class) பயன்படுத்தலாம் (எ.கா. `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // பதிவேற்றும்போது ஒரு Multer பிழை ஏற்பட்டது.
    } else if (err) {
      // பதிவேற்றும்போது அறியப்படாத பிழை ஏற்பட்டது.
    }

    // எல்லாம் சரியாக நடந்தது.
  })
})
```

## தனிப்பயன் சேமிப்பக இயந்திரம்

உங்கள் சொந்த சேமிப்பக இயந்திரத்தை எவ்வாறு உருவாக்குவது என்பது பற்றிய தகவலுக்கு, [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md) ஐப் பார்க்கவும்.

## உரிமம்

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
