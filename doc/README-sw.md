# Multer [![Build Status](https://badgen.net/github/checks/expressjs/multer/master?label=ci)](https://github.com/expressjs/multer/actions/workflows/ci.yml) [![Test Coverage](https://badgen.net/coveralls/c/github/expressjs/multer/master)](https://coveralls.io/r/expressjs/multer?branch=master) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer ni **middleware ya Node.js** inayokusadia kushughulikia fomu za `multipart/form-data`, ambazo hutumika hasa kwa kupakia faili zenye picha, document na pia maandishi. Imejengwa juu ya [busboy](https://github.com/mscdex/busboy) kwa lengo la kutoa ufanisi na kurahisisha kazi ya ku kupakia picha,file na maandishi kwa pamoja.

**Kidokezo**: Multer haiwezi kushughulikia fomati nyingine isipokuwa `multipart/form-data`.

## Tafsiri

Hi README faili inapatikana pia kwa lugha zingine:

- [العربية](https://github.com/expressjs/multer/blob/master/doc/README-ar.md) (Kiarabu)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (Kispanyola)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (Kichina)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (Kikorea)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (Kirusi)
- [Việt Nam](https://github.com/expressjs/multer/blob/master/doc/README-vi.md) (Kiviatnam)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (Kiportuguali cha Brazil)
- [Français](https://github.com/expressjs/multer/blob/master/doc/README-fr.md) (Kifaransa)
- [O'zbek tili](https://github.com/expressjs/multer/blob/master/doc/README-uz.md) (Kiuzbeki)

## Usakinishaji

```sh
$ npm install --save multer
```

## Matumizi

Multer huongeza objekti ya `body` na objekti ya `file` au `files` kwenye objekti ya `request`.Objekti ya `body` inahifadhi viingilio vya maandishi kutoka kwenye fomu,na pia  objekti ya `file` au `files` inahifadhi **faili zilizopakiwa kupitia fomu hiyo kama picha**.

Mfano wa matumizi ya Multer:

Usisahau kutumia sifa (attributes) ya HTML `<enctype="multipart/form-data">` ndani ya fom yako.

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
  // req.file ni 'avatar' fili
  // req.body itashikilia maandishi viingilio kama zipo zozote.
})

app.post('/photos/upload', upload.array('photos', 12), (req, res) => {
  // req.files ni array ya 'photo' file
  // req.body itakuwa na maandishi viingilio kama zipo zozote.
})

const uploadMiddleware = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
])
app.post('/cool-profile', uploadMiddleware, (req, res) => {
  // req.files ni object yenye arrays ya faili
  // mfano.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  // req.body itakuwa na maandishi viingilio kama zipo zozote.
})
```

Ikiwa unahitaji kushughulikia fomati yenye maandishi tu bila faili inashauriwa utumie mbinu ya 
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

Huu hapa ni mfano wa jinsi Multer inavyotumika katika fomu ya HTML.Chukua tahadhari maalum kwa enctype="multipart/form-data" na sehemu ya name="uploaded_file":

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Kisha, katika faili yako ya JavaScript, ungeongeza mistari hii ili kufikia faili pamoja na maudhui ya body.Ni muhimu kutumia thamani ya sehemu ya `name` kutoka kwenye fomu ndani ya kazi yako ya kupakia (upload function).Hii uieleza program ya Multer ni sehemu gani katika ombi lako(request) inapaswa kutafuta faili.Ikiwa sehemu hizi hazifanani kati ya fomu ya HTML na seva(server) yako, upakiaji (upload) utafeli.

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

Key | Description | Note
--- | --- | ---
`fieldname` | Jina la sehemu (field) lililotangazwa katika fomu |
`originalname` | jina la file lilipo kwenye kompyuta ya mtumiaji |
`encoding` | Aina ya usimbaji wa faili |
`mimetype` | Aina ya faili (mime type) |
`size` | Ukubwa wa faili kwa byte   |
`destination` | Folda ambayo faili imehifadhiwa | `DiskStorage`
`filename` | Jina la faili ndani ya folda ya `destination` linatengenezwa kwa njia ya kiotomatiki. | `DiskStorage`
`path` |Njia kamili ya faili iliypohifathidhiwa kwa ajili ya `upload` | `DiskStorage`
`buffer` | Hifadhi ya muda (`Buffer`) ya faili nzima | `MemoryStorage`

### `multer(opts)`

Multer hukuwa na chaguo (options object), ambazo msingi wake ni mali (property) ya `dest`, inayo iambia programu ya Multer mahali pa kupakia faili. Ikiwa huhitaji kuweka kitu cha chaguo, faili zitahifadhiwa kwenye kumbukumbu ya muda (memory) na hazitaandikwa kwenye diski.

Kwa kawaida, Multer itabadilisha majina ya faili ili kuepuka migongano ya majina. Kazi ya kubadilisha majina inaweza kubinafsishwa kulingana na mahitaji yako.

Hizi hapa ni chaguzi ambazo zinaweza kutumiwa na programu ya Multer.

| Chaguo (Option)   | Maelezo                  |
|-------------------|-------------------------------------|
| `dest`            | Folda ya kuhifadhi                   |
| `storage`         | Uchanganuzi zaidi (DiskStorage/MemStorage) |
| `fileFilter`      | Chaguo la kuepuka baadhi ya faili   |
| `limits`          | Mipaka ya ukubwa, idadi, nk.        |
| `preservePath`    | Endelevu njia halisi                 |

Katika programu ya tuvuti ya kawaida, chaguo pekee kinachoweza kuhitajika ni `dest`, na kinaweza kusanidiwa kama ilivyoonyeshwa katika mfano ufuatao.

```javascript 
const upload = multer({ dest: 'uploads/' })
```

kama unahitaji udthibiti kwa ajili ya upload yako. utahitajika kutumia chaguwo (option) ya `storage` badala ya `dest`. Multer inakuja na `storage engine` yake ambazo ni  `DiskStorage` na `MemoryStorage`storage injin.Zengine zinapatika kutoka kwa programu zengine.

#### `.single(fieldname)`

Kubali faili moja lenye jina `fieldname`. Faili hiyo moja itahifadhiwa katika `req.file`.


#### `.array(fieldname[, maxCount])`

Kubali orodha  ya `Array` ya faili, zote zikiwa na jina `fieldname`. Hiari, toa kosa ikiwa faili zaidi ya `maxCount` zitapakiwa. file ambazo zipo kwa mfumo wa Orodha (array)  zitahifadhiwa katika `req.files`.

#### `.fields(fields)`

Kubali mchanganyiko wa faili, uliobainishwa kwa kutumia `fields`. file ambazo zipo kwa mfumo wa Orodha (array)  zitahifadhiwa katika `req.files`.

`fields` inapaswa kuwa orodha ya vitu (objects) vyenye jina `name` na hiari `maxCount`.
Mfano:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Kubali sehemu za maandishi pekee. Ikiwa faili lolote litajaribu kupakiwa, kosa lenye msimbo(code)  
"LIMIT\_UNEXPECTED\_FILE" itarushwa.

#### `.any()`

Mbinu hii inakubali faili zote zinazopitishwa kupitia mtandao. Orodha(array) yoyote ya faili itawekwa katika `req.files`.

**Tahadhari:** Hakikisha unashughulikia kila faili linalopakiwa na mtumiaji.  
Usiongeze **multer** kama middleware ya kimataifa kwa sababu mtumiaji mwengine ambaye hana ruhusa na nia mbaya anaweza kubainisha file yake anaweza kupakia faili kwenye njia (route) ambayo hukutarajia.  
Tumia fungsi hizi tu kwenye njia ambazo unashughulikia faili zilizopakiwa.

### `storage`

#### `DiskStorage`

Hii (`disk storage` injin ) inakupa udhibiti kamili wa jinsi faili zinavyohifadhiwa kwenye diski.

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
zinazobainisha mahali faili linapaswa kuhifadhiwa.

`destination` hutumika kubainisha folda ambayo faili zilizopakiwa zitahifadhiwa ndani yake.  
Hii pia inaweza kutolewa kama `string` (mfano: `'/tmp/uploads'`).  
Ikiwa hakuna `destination` iliyotolewa, saraka ya chaguo-msingi ya mfumo wa uendeshaji kwa ajili ya faili za muda (temporary files) itatumika.

**Kumbuka:** Wewe ndiye unawajibika kuunda saraka (directory) unapotoa `destination` kama kazi (function).  
Unapopitisha `destination` kama string, multer itahakikisha saraka hiyo inaundwa kwa ajili yako.

`filename` hutumika kubainisha jina la faili ndani ya folda.  
Ikiwa hakuna `filename` itakayotolewa, kila faili itapewa jina la nasibu lisilo na kiambatanisho cha faili (file extension).

**Kumbuka:** Multer haitoi kiambatanisho cha faili (file extension) kwa jina la faili kwa niaba yako,  
kazi yako inapaswa kurudisha jina la faili lililo kamili pamoja na kiambatanisho chake.

Kazi kila moja hupokea maombi (`req`) pamoja na taarifa fulani kuhusu faili (`file`) kusaidia katika uamuzi.

Kumbuka kwamba `req.body` huenda bado haijakamilika kujazwa kabisa.  
Hii inategemea mfuatano wa jinsi mteja anavyotuma sehemu za fomu na faili kwenye seva.

Kwa kuelewa jinsi ya kuitisha callback inayotumia mlinganyo wa kupitisha `null` kama parameta ya kwanza,  
rejelea [Node.js error handling](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors).


#### `MemoryStorage`

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

### `limits`

Kitu (object) kinachobainisha mipaka ya ukubwa wa mali zifuatazo za hiari.  
Multer hupitisha kitu hiki moja kwa moja kwa busboy, na maelezo ya mali hizi yanaweza kupatikana kwenye [ukurasa wa busboy](https://github.com/mscdex/busboy#busboy-methods).

Haya ni maadili ya nambari (integer) yanayopatikana:

Key | Description | Default
--- | --- | ---
`fieldNameSize` | Max field name size | 100 bytes
`fieldSize` | Max field value size (in bytes) | 1MB
`fields` | Max number of non-file fields | Infinity
`fileSize` | For multipart forms, the max file size (in bytes) | Infinity
`files` | For multipart forms, the max number of file fields | Infinity
`parts` | For multipart forms, the max number of parts (fields + files) | Infinity
`headerPairs` | For multipart forms, the max number of header key=>value pairs to parse | 2000

Kuweka mipaka kunaweza kusaidia kulinda tovuti yako dhidi ya mashambulizi ya **kuzuia huduma** (Denial of Service - DoS).

### `fileFilter`

Weka hii kuwa kazi (function) ili kudhibiti ni faili gani zinapaswa kupakiwa na ni zipi zipaswe kupuuzwa.  
Kazi hiyo inapaswa kuonekana kama ifuatavyo:

```javascript
function fileFilter (req, file, cb) {

  // Kazi hii inapaswa kuita `cb` kwa kutumia boolean
  // kuonyesha kama faili inapaswa kukubaliwa

  // Kwamnkuza faili hii, pitisha `false`, kama ifuatavyo:
  cb(null, false)

  // Kwamkubali faili hii, pitisha `true`, kama ifuatavyo:
  cb(null, true)

  // Pia unaweza kuwasilisha hitilafu (error) kama kuna tatizo:
  cb(new Error('Sina wazo!'))

}

```

## Error handling

Unapokutana na kosa (error), Multer ataelekeza kosa hilo kwa Express. Unaweza kuonyesha ukurasa mzuri wa kosa kwa kutumia [njia ya kawaida ya Express](http://expressjs.com/guide/error-handling.html).

Ikiwa unataka kushika makosa maalum kutoka Multer, unaweza kuitisha mwenyewe function ya middleware. Pia, kama unataka kushika makosa tu ya [Multer errors](https://github.com/expressjs/multer/blob/master/lib/multer-error.js), unaweza kutumia darasa la `MulterError` lililoambatanishwa na kitu cha `multer` (mfano: `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Kumetokea kosa la Multer wakati wa kupakia faili.
    } else if (err) {
      // Kumetokea kosa lisilojulikana wakati wa kupakia faili.
    }

    // Kila kitu kilienda sawa.
  })
})
```

## Injini ya kuhifadhi maalum (Custom storage engine)

Kwa taarifa kuhusu jinsi ya kujenga injini yako mwenyewe ya kuhifadhi, tazama [Multer Storage Engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## Leseni

[MIT](LICENSE)
