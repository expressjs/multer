# Multer [![Build Status](https://badgen.net/github/checks/expressjs/multer/master?label=ci)](https://github.com/expressjs/multer/actions/workflows/ci.yml) [![Test Coverage](https://badgen.net/coveralls/c/github/expressjs/multer/master)](https://coveralls.io/r/expressjs/multer?branch=master) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer ni **middleware ya Node.js** inayokusadia kushughulikia fomu za `multipart/form-data`, ambazo hutumika hasa kwa kupakia faili zenye picha, document na pia maandishi kwa wakati moja. Imejengwa juu ya [busboy](https://github.com/mscdex/busboy) kwa lengo la kutoa ufanisi na kurahisisha kazi ya kupakia picha,file na maandishi kwa pamoja.

**Kidokezo**: Multer haiwezi kushughulikia fomati nyingine isipokuwa `multipart/form-data`.

## Tafsiri

Hi README faili inapatikana pia kwa lugha zingine:

| Lugha Asilia                                                                  | Kiswahili              |
| ----------------------------------------------------------------------------- | ---------------------- |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)     | Kiarabu                |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Kichina                |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)    | Kifaransa              |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)        | Kikorea                |
| [Português (Brasil)](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Kiportugali (Brazil)   |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Kirusi                 |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)     | Kihispania             |
| [Oʻzbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md) | Kiuzbeki               |
| [Tiếng Việt](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)  | Kivietinamu            |

## Usakinishaji

```sh
$ npm install --save multer
```

## Matumizi

Multer huongeza vitu viwili kwenye objekti ya `request`.Hivi ni objekti ya `body` inayoshikilia maelezo yote ya sehemu za maandishi za fomu,na objekti ya `file` au `files` inayojumuisha faili zote zilizopakiwa kupitia fomu hiyo kama mfano picha,nyaraka,faili za sauti,na aina zengine za faili.Hii inafanya iwe rahisi kupata data zote pamoja na kuzituma kwenye seva yako.

Mfano wa matumizi ya Multer:

Usisahau kutumia sifa (attribute) ya HTML`<enctype="multipart/form-data">` ndani ya fomu yako.

```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" />
</form>
```

```javascript
const express = require('express')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const app = express()

app.post('/profile', upload.single('avatar'), (req, res) => {
  // req.file ni 'avatar' faili
  // req.body itashikilia maandishi viingilio kama zipo zozote.
})

app.post('/photos/upload', upload.array('photos', 12), (req, res) => {
  // req.files ni array ya 'photo' file
  // req.body itashikilia maandishi viingilio kama zipo zozote.
})

const uploadMiddleware = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
])
app.post('/cool-profile', uploadMiddleware, (req, res) => {
  // req.files ni objekti yenye arrays ya faili
  // mfano.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  // req.body itakuwa na maandishi viingilio kama zipo zozote.
})
```

Ikiwa unahitaji kushughulikia fomati yenye maandishi tu bila faili inashauriwa utumie mbinu ya:  
`.none()`

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()
app.post('/profile', upload.none(), (req, res) => {
  // req.body itakuwa na maandishi pekee
})
```

Kwa mfano wa hapo chini tunangalia jinsi gani programu ya `Multer` inavyotumika katika fomu ya `HTML`.Chukua tahadhari maalum kwa sehemu ya `enctype="multipart/form-data"` na ya `name="uploaded_file"` ukiwa unaunda fomu yako kwa kutumia `HTML`.

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Kisha, katika faili yako ya javaScript, uongeze msimbo(code) hii uweze kufikia faili pamoja na maudhui ya body.Ni muhimu kutumia thamani ya sehemu ya `name` kutoka kwenye fomu ndani ya kazi yako ya kupakia (upload function).Hii uieleza program ya Multer ni sehemu gani katika ombi lako (request) inapaswa kutafuta faili. Ikiwa sehemu hizi hazifanani kati ya fomu ya HTML na serva yako, upakiaji wako utafeli.

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
 // req.file ni jina la faili yako kwenye fomu hapo juu, hapa ni 'uploaded_file'
// req.body itahifadhi sehemu za maandishi, kama zipo
  console.log(req.file, req.body)
});
```



## API

### Tarifa za faili

Kila faili ina tarifa zifwatazo:

Key | Maelezo | Noti
--- | --- | ---
`fieldname` | jina la sehemu (field) lililotangazwa katika fomu |
`originalname` | jina la file lilipo kwenye kompyuta ya mtumiaji |
`encoding` | Aina ya usimbaji wa faili |
`mimetype` | Aina ya faili (mime type) |
`size` | Ukubwa wa faili kwa byte   |
`destination` | Folda ambayo faili imehifadhiwa | `DiskStorage`
`filename` | jina la faili ndani ya folda ya `destination` linatengenezwa kwa njia ya kiotomatiki. | `DiskStorage`
`path` |Njia kamili ya faili iliyohifadhiwa kwa ajili ya `upload` | `DiskStorage`
`buffer` | Hifadhi ya muda (`Buffer`) ya faili nzima | `MemoryStorage`

### `multer(opts)`

Multer ukubali chaguo objekti (options object), ambazo msingi wake ni mali (property) ya `dest`, inayo iambia programu ya Multer mahali pa kupakia faili. Ikiwa huhitaji kuweka kitu cha chaguo, faili zitahifadhiwa kwenye kumbukumbu ya muda (memory) na hazitaandikwa kwenye diski.

Kwa kawaida, `Multer` itabadilisha majina ya faili ili kuepuka migongano ya majina. Kazi ya kubadilisha majina inaweza kubinafsishwa kulingana na mahitaji yako.

Hizi hapa ni chaguzi ambazo zinaweza kutumiwa na programu ya Multer.

| Chaguo (Option)   | Maelezo           |
|-------------------|-------------------------------------|
| `dest` au `storage` | Wapi kuhifadhi fiali     |
| `fileFilter`| Chaguo la kuepuka baadhi ya faili zitakubalika  |
| `limits`          | Idadi ya ukubwa wa data        |
| `preservePath`    | Hifathi njia halisi badala ya jina too      |

Katika programu ya ukurasa wa tuvuti ya kawaida, unaweza kuhitaji `dest` peke yake, na kinaweza kusanidiwa kama ilivyo onyeshwa katika mfano ufuatao.

```javascript 
const upload = multer({ dest: 'uploads/' })
```

kama unahitaji udthibiti kwa ajili ya `upload` yako utahitajika kutumia chaguwo (option) ya `storage` badala ya `dest`. Multer inakuja na `storage engine` zake ambazo ni  `DiskStorage` na `MemoryStorage`storage injin.Zengine zinapatika kutoka kwa programu zengine.

#### `.single(fieldname)`

Hii mbinu hutumika kukubali faili moja lenye jina `fieldname`. Faili hiyo moja itahifadhiwa katika `req.file`.


#### `.array(fieldname[, maxCount])`

Hii mbinu hutumika kukubali orodha za faili zaidi ya mbili, `Array` za faili kwa kutumia kingilio kimoja, zote zikiwa na jina `fieldname`.Kuna chaguwo ya kupata alama ya hitilafu kama idadi ya faili imezidi kiwangu kilicho wekwa hiyo ni `maxCount`

#### `.fields(fields)`

Hii mbinu hutumika pale fomu ya mtumiaji ina viiabatinishi vingi na unataka kuvitumia kila kimoja kwa njia tafauti katika fomu moja, iliobainishwa kwa kutumia `fields`.Fiali ambazo zipo kwa mfumo wa Orodha (array) zitahifadhiwa katika `req.files`.

`fields` inapaswa kuwa na orodha ya vitu (objects) vyenye jina `name` na hiari(option) ya `maxCount`.
Mfano:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Hi mbinu hutimika kukubali sehemu za maandishi peke yake. Ikiwa faili lolote litajaribu kupakiwa, Hitilafu yenye msimbo(code) itarushwa na kuonekana kwenye terminal.
"LIMIT\_UNEXPECTED\_FILE" .

#### `.any()`

Mbinu hii inakubali faili zote zinazopitishwa kupitia fomu. Orodha(array) yoyote ya faili itawekwa katika `req.files`.

**Tahadhari:** Hakikisha unashughulikia kila faili linalopakiwa na mtumiaji.  
Usiongeze **multer** kama middleware ya global kwa sababu mtumiaji mwengine ambaye hana ruhusa na nia mbaya anaweza kubainisha file yake na anaweza kupakia faili kwenye njia (route) ambayo hukutarajia.  
Tumia functions hizi tu kwenye njia ambazo unashughulikia faili zilizopakiwa.

### `Hifadhi (storage)`

#### `DiskStorage`

Hii (`disk storage` injin ) inakupa udhibiti kamili wa jinsi faili zinavyo hifadhiwa kwenye diski.

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

Kuna chaguzi mbili zinazopatikana: `destination` na `filename`. Zote ni functions ambazo  
zinazobainisha mahali faili inapaswa kuhifadhiwa.

`destination` hutumika kubainisha folda ambayo faili zilizopakiwa zitahifadhiwa ndani yake.  
Hii pia inaweza kutolewa kama `string` (mfano: `'/tmp/uploads'`).  
Ikiwa hakuna `destination` iliyotolewa, saraka ya chaguo-msingi ya mfumo wa uendeshaji kwa ajili ya faili za muda (temporary files) itatumika.

**Kumbuka:** Wewe ndiye unawajibika kuunda saraka (directory) unapotoa `destination` kama kazi (function).  
Unapopitisha `destination` kama maandishi, multer itahakikisha saraka hiyo inaundwa kwa ajili yako.

`filename` hutumika kubainisha jina la faili ndani ya folda.  
Ikiwa hakuna `filename` itakayotolewa, kila faili itapewa jina la nasibu lisilo na kiambatanisho cha faili (file extension).

**Kumbuka:** Multer haitoi kiambatanisho cha faili (file extension) kwa jina la faili kwa niaba yako,  
kazi(function) yako inapaswa kurudisha jina la faili lililo kamili pamoja na kiambatanisho chake.

Kila Kazi(function) moja hupokea maombi (`req`) pamoja na taarifa fulani kuhusu faili (`file`) kusaidia katika uamuzi.

Kumbuka kwamba `req.body` huenda bado haijakamilika kujazwa kabisa.  
Hii inategemea mfuatano wa jinsi mteja anavyotuma sehemu za fomu na faili kwenye serva.

Kwa kuelewa jinsi ya kuitisha callback inayotumia mlinganyo wa kupitisha `null` kama parameta ya kwanza,  
rejelea [Node.js error handling](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors).


#### `Uhifadhi wa Kumbukumbu (MemoryStorage)`

Injini ya hifadhi ya kumbukumbu (memory storage engine) inahifadhi faili kama vitu vya `Buffer` kwenye kumbukumbu.  
Haina chaguzi yoyote.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Unapotumia hifadhi ya kumbukumbu (memory storage), taarifa za faili zitakuwa na sehemu iitwayo  
`buffer` ambayo ina faili zote.

**TAHATHARI:** Kupakia faili kubwa sana, au faili ndogo kwa wingi kwa haraka sana, kunaweza  
kusababisha programu yako kukosa kumbukumbu (memory) endapo hutumia hifadhi ya kumbukumbu.

### `Mipaka (limits)`

limits ni chaguo inayotumika kudhibiti ukubwa na idadi ya faili zinazopakiwa kwenye serva yako, ili kuzuia matatizo kama idadi ya faili na kuzuwia kupakia mafali mengi kwa wakati moja.  
Multer hupitisha objekti hiyo moja kwa moja kwa `busboy`, na maelezo yake yanaweza kupatikana kwenye [ukurasa wa busboy](https://github.com/mscdex/busboy#busboy-methods).

Mfano:

```javaScript
const upload = multer({
  storage: ...,   // mipangilio ya kuhifadhi faili
  limits: {
    fieldNameSize: 100,        // ukubwa wa herufi kwa jina la field (baiti)
    fieldSize: 1024 * 1024,    // ukubwa wa data ya maandishi (field value) kwa baiti
    fields: 10,                // idadi ya fields za maandishi (zisizo faili)
    fileSize: 5 * 1024 * 1024, // ukubwa wa faili moja (5MB)
    files: 5,                  // idadi ya faili zinazoruhusiwa
    parts: 15,                 // jumla ya fields + fiali
    headerPairs: 2000          // max key=>value pairs kwenye header
  }
});
```

Haya ni maadili ya nambari (integer) yanayopatikana:

Funguo (Key) | Maelezo (Description) | Thamani ya Default
--- | --- | ---
`fieldNameSize` | Ukubwa mkubwa wa jina la field (baiti) | Bytes 100
`fieldSize` | Ukubwa mkubwa wa thamani ya field (baiti) | 1MB
`fields` | Idadi kubwa ya fields zisizo za faili | Bila kikomo (Infinity)
`fileSize` |Kwa fomu za multipart, ukubwa mkubwa wa faili (baiti) | Bila kikomo (Infinity)
`files` | Kwa fomu za multipart, idadi kubwa ya fields za faili | Bila kikomo (Infinity)
`parts` | Kwa fomu za multipart, jumla ya sehemu (fields + files)(fields + files) | Bila kikomo (Infinity)
`headerPairs` | Kwa fomu za multipart, idadi kubwa ya header key=>value pairs za kuchakata| 2000

Kuweka mipaka kunaweza kusaidia kulinda tovuti yako dhidi ya mashambulizi ya **kuzuia huduma** (Denial of Service - DoS).

### `fileFilter`

Weka hii kuwa kazi (function) ili kudhibiti ni faili gani zinapaswa kupakiwa na ni zipi zipaswe kupuuzwa.  
Kazi hiyo inapaswa kuonekana kama ifuatavyo:

```javascript
function fileFilter (req, file, cb) {

  // Kazi hii inapaswa kuita `cb` kwa kutumia boolean
  // kuonyesha kama faili inapaswa kukubaliwa

  // Kuikata faili hii, pitisha `false`, kama ifuatavyo:
  cb(null, false)

  // Kuikubali faili hii, pitisha `true`, kama ifuatavyo:
  cb(null, true)

  // Pia unaweza kuwasilisha hitilafu (error) kama tatizo litatokea :
  cb(new Error('Sijuwi kunaendelea nini!'))

}

```

## Kushughulikia hitilafu (Error handling)

Unapokutana na kosa au hitilafu (error), Multer itaipa majukumu hayo kwa Express. Unaweza kuonyesha hitilafu vizuri kwa kutumia [njia ya kawaida ya Express](http://expressjs.com/guide/error-handling.html).

Ikiwa unataka kushika makosa maalum kutoka Multer, unaweza kuitisha mwenyewe function ya middleware. Pia, kama unataka kushika hitilafu tu ya [Multer errors](https://github.com/expressjs/multer/blob/master/lib/multer-error.js), unaweza kutumia darasa la `MulterError` lililoambatanishwa na objekti ya `multer` (mfano: `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Kumetokea hitilafu la Multer wakati wa kupakia faili.
    } else if (err) {
      // Kumetokea hitilafu isilojulikana wakati wa kupakia faili.
    }
    // Kila kitu kilienda sawa.
  })
})
```

## Injini maalum ya kuhifadhi (Custom storage engine)

Kwa taarifa kuhusu jinsi ya kujenga injini yako mwenyewe ya kuhifadhi, tazama [Multer Storage Engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## Leseni

[MIT](LICENSE)
