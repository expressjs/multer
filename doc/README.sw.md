# Multer [![Build Status](https://badgen.net/github/checks/expressjs/multer/master?label=ci)](https://github.com/expressjs/multer/actions/workflows/ci.yml) [![Test Coverage](https://badgen.net/coveralls/c/github/expressjs/multer/master)](https://coveralls.io/r/expressjs/multer?branch=master) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer ni **middleware ya Node.js** ya kushughulikia `multipart/form-data`, ambayo huwa hutumika hasa kwa kupakia faili. Imejengwa juu ya [busboy](https://github.com/mscdex/busboy) kwa lengo la kutoa ufanisi mkubwa.

**Kidokezo**: Multer haiwezi kushughulikia fomati nyingine isipokuwa `multipart/form-data`.

---

## Tafsiri

Hi README faili inapatikana pia kwa lugha zingine:

- [العربية](https://github.com/expressjs/multer/blob/master/doc/README-ar.md) (Kiarabu)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (Kispanyola)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (Kichina)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (Kikorea)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (Kirusi)
- [Việt Nam](https://github.com/expressjs/multer/blob/master/doc/README-vi.md) (Kiviatnam)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (Kiportuguali cha Brazil)
- [Français](https://github.com/expressjs/multer/blob/master/doc/README-fr.md) (Kifaranca)
- [O'zbek tili](https://github.com/expressjs/multer/blob/master/doc/README-uz.md) (Kiuzbeki)

## Usakinishaji

```sh
$ npm install --save multer

```

## Matumizi

Multer huongeza **objekti ya `body`** na **objekti ya `file`** au **`files`** kwenye objekti ya `request`.Objekti ya `body` inahifadhi **maadili ya sehemu za maandishi** kutoka kwenye fomu,na objekti ya `file` au `files` inahifadhi **faili zilizopakiwa kupitia fomu hiyo**.


Mfano wa matumizi ya Multer:

Usisahau kutumia `<enctype="multipart/form-data">` ndani ya fom yako.

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
  // req.body itashikilia mandishi kama yapo yoyote.
})

app.post('/photos/upload', upload.array('photos', 12), (req, res) => {
  // req.files ni array ya 'Picha'
  // req.body itashikilia mandishi kama yapo yoyote.
})

const uploadMiddleware = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
])
app.post('/cool-profile', uploadMiddleware, (req, res) => {
  // req.files ni object yenye arrays ya faili
  // req.body ni data ya maandishi
})
```

Ikiwa unahitaji kushughulikia fomati yenye maandishi tu bila faili:

```javascript
app.post('/profile', upload.none(), (req, res) => {
  // req.body ina maandishi pekee
})
```

---

## API

### Habari za faili

Kila faili lina kila moja ya sifa hizi:

| Sifa         | Maelezo                                     | Imetumika kwenye |
| ------------ | ------------------------------------------- | ---------------- |
| fieldname    | Jina la input kwenye form                   |                  |
| originalname | Majina ya awali kwenye kompyuta ya mtumiaji |                  |
| encoding     | Ufungaji wa faili (encoding)                |                  |
| mimetype     | Aina ya faili (mime type)                   |                  |
| size         | Ukubwa wa faili kwa byte                    |                  |
| destination  | Folda iliyohifadhiwa (DiskStorage)          | DiskStorage      |
| filename     | Jina la faili kwenye folda                  | DiskStorage      |
| path         | Njia kamili ya faili kwenye disk            | DiskStorage      |
| buffer       | Buffer ya faili zima ikiwa katika memory    | MemoryStorage    |

---

### `multer(opts)`

Chaguzi kuu ni:

* `dest`: folda ya kuhifadhi
* `storage`: uchanganuzi zaidi (DiskStorage/MemStorage)
* `fileFilter`: chaguo la kuepuka baadhi ya faili
* `limits`: mipaka ya ukubwa, idadi, nk.
* `preservePath`: endeleza njia halisi

**Matumizi ya msingi:**

```javascript
const upload = multer({ dest: 'uploads/' })
```

Ugavi wa `storage` wa kiwango cha juu:

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '/tmp/my-uploads'),
  filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now())
})
const upload = multer({ storage })
```

---

### Mbinu za kupakia

* `upload.single(fieldname)`: faili 1 tu. Inasomwa kwenye `req.file`.
* `upload.array(fieldname[, maxCount])`: faili nyingi za aina moja. Hivyo `req.files` ni array.
* `upload.fields(fieldsArray)`: kopanya maeneo tofauti ya kupakia katika `req.files` kama object.
* `upload.none()`: maandishi tu, faili zitapelekea kosa.
* `upload.any()`: kupakia faili yoyote. `req.files` ni array.

---

### `storage`

#### DiskStorage

Unaweza kudhibiti folda (`destination`) na jina la faili (`filename`).
**Tahadhari**: lazimisha picha kuunda folda mwenyewe kama unatumia function.
DiskStorage haitajumuishi upanuzi wa faili, hivyo largura jina kamili.

#### MemoryStorage

Hifadhi failini kwa buffer kwenye kumbukumbu. **Tahadhari**: inaweza kutumia RAM nyingi.

---

### `limits`

Mipaka inayoweza kuainishwa:

* `fieldNameSize`: ukubwa wa jina la kujaza – default 100 bytes
* `fieldSize`: data ya form – default 1 MB
* `fields`, `files`, `parts`, `headerPairs` – default zisizo na kikomo (kipindi cha 2000 kwa headerPairs)

Mipaka hii inasaidia kujikinga dhidi ya mashambulizi ya DoS.

---

### `fileFilter`

Unaweza kuzuia kupakia faili zisizohitajika:

```javascript
function fileFilter(req, file, cb) {
  // cb(null, true) – kubali
  // cb(null, false) – kataza
  // cb(new Error('...')) – kosa
}
```

---

## Kushughulikia Makosa

Express itashughulikia kosa moja kwa moja kutoka Multer.
Unaweza kutambua `err instanceof multer.MulterError` ili utende tofauti.

```javascript
upload(req, res, err => {
  if (err instanceof multer.MulterError) {
    // kosa la Multer
  } else if (err) {
    // kosa la kawaida
  }
  // Sawa
})
```

---

## Kuunda Storage Engine yako mwenyewe

Tazama mwongozo `StorageEngine.md` kwa jinsi ya kuunda engine yako.

---

## Leseni

Licensed chini ya **MIT**.

---

🛠️ Kama ungependa, niweza kukusaidia pia:

* Kutafsiri sehemu zaidi ya README (kwa mfano: limits, storage)
* Kupendekeza jina la faili (wa `.sw.md`)
* Kuhakikisha tafsiri bora ya istilahi (kwa mfano: `middleware`, `buffer`, `encoding`)

Tuma tu sehemu gani ungependa nipatie ya Kiswahili, pamoja na usanifu wako, nishirikie!
