# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer — bu `multipart/form-data` bilan ishlash uchun mo'ljallangan node.js middleware bo'lib, asosan fayllarni yuklash uchun ishlatiladi. Maksimal samaradorlikka erishish uchun u
[busboy](https://github.com/mscdex/busboy) ustiga qurilgan.

**ESLATMA**: Multer multipart bo'lmagan (`multipart/form-data`) har qanday formani qayta ishlamaydi.

## Tarjimalar

Ushbu README boshqa tillarda ham mavjud:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | Inglizcha       |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Arabcha         |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Xitoycha (soddalashtirilgan) |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | Fransuzcha      |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | Yaponcha        |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | Indonezcha    |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | Koreyscha       |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Portugalcha (Braziliya) |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Ruscha          |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | Ispancha        |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | Tamilcha        |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | Vyetnamcha      |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | Turkcha         |


## O'rnatish

```sh
$ npm install multer
```

## Foydalanish

Multer `request` ob'ektiga `body` ob'ektini hamda `file` yoki `files` ob'ektini qo'shadi. `body` ob'ekti formaning matnli maydonlari qiymatlarini, `file` yoki `files` ob'ekti esa forma orqali yuklangan fayllarni o'z ichiga oladi.

Oddiy foydalanish namunasi:

Formangizda `enctype="multipart/form-data"` ko'rsatishni unutmang.

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
  // req.file — bu `avatar` fayli
  // req.body matnli maydonlarni saqlaydi, agar ular bo'lsa
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files — bu `photos` fayllari massivi
  // req.body matnli maydonlarni o'z ichiga oladi, agar ular bo'lsa
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files — bu ob'ekt (String -> Array), bunda fieldname kalit, qiymat esa fayllar massivi
  //
  // masalan:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body matnli maydonlarni o'z ichiga oladi, agar ular bo'lsa
})
```

Agar sizga faqat matndan iborat multipart formani qayta ishlash kerak bo'lsa, `.none()` metodidan foydalaning:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body matnli maydonlarni o'z ichiga oladi
})
```

Quyida multer HTML formada qanday ishlatilishiga misol keltirilgan. `enctype="multipart/form-data"` va `name="uploaded_file"` maydonlariga alohida e'tibor bering:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

So'ngra javascript faylingizga faylga ham, body'ga ham murojaat qilish uchun quyidagi qatorlarni qo'shasiz. Yuklash funksiyangizda formadagi `name` maydonining qiymatini ishlatishingiz muhim. Bu multerga so'rovning qaysi maydonidan fayllarni izlash kerakligini bildiradi. Agar bu maydonlar HTML formada va serveringizda bir xil bo'lmasa, yuklash muvaffaqiyatsiz tugaydi:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file — yuqoridagi formadagi faylingizning nomi, bu yerda 'uploaded_file'
  // req.body matnli maydonlarni saqlaydi, agar ular bo'lsa
  console.log(req.file, req.body)
});
```



## API

### Fayl haqida ma'lumot

Har bir fayl quyidagi ma'lumotlarni o'z ichiga oladi:

Kalit | Ta'rif | Eslatma
--- | --- | ---
`fieldname` | Formada ko'rsatilgan maydon nomi |
`originalname` | Foydalanuvchi kompyuteridagi fayl nomi yoki `preservePath: true` bo'lganda to'liq yo'l |
`encoding` | Faylning kodlash turi |
`mimetype` | Faylning mime turi |
`size` | Fayl hajmi (baytlarda) |
`destination` | Fayl saqlangan papka | `DiskStorage`
`filename` | `destination` ichidagi fayl nomi | `DiskStorage`
`path` | Yuklangan faylning to'liq yo'li | `DiskStorage`
`buffer` | Butun faylning `Buffer`i | `MemoryStorage`

### `multer(opts)`

Multer parametrlar ob'ektini qabul qiladi, ulardan eng asosiysi `dest`
xususiyati bo'lib, u Multerga fayllarni qayerga yuklash kerakligini bildiradi. Agar parametrlar
ob'ektini bermasangiz, fayllar xotirada saqlanadi va hech qachon diskka yozilmaydi.

Standart holatda Multer nomlar to'qnashuvining oldini olish uchun fayllarni qayta nomlaydi. Qayta
nomlash funksiyasini o'z ehtiyojlaringizga mos ravishda sozlashingiz mumkin.

Quyida Multerga berilishi mumkin bo'lgan parametrlar keltirilgan.

Kalit | Ta'rif
--- | ---
`dest` yoki `storage` | Fayllarni qayerda saqlash
`fileFilter` | Qaysi fayllar qabul qilinishini boshqaruvchi funksiya
`limits` | Yuklanadigan ma'lumotlar chegaralari
`preservePath` | `file.originalname` ichida faqat asosiy nom o'rniga mijoz yuborgan to'liq yo'lni saqlash
`defParamCharset` | Kengaytirilgan parametr bo'lmagan (ya'ni aniq charset ko'rsatilmagan) qism sarlavhasi parametrlari qiymatlari (masalan, fayl nomi) uchun ishlatiladigan standart belgilar to'plami. Standart qiymat: `'latin1'`

Oddiy veb-ilovada faqat `dest` kerak bo'lishi mumkin va u quyidagi
misolda ko'rsatilganidek sozlanadi.

```javascript
const upload = multer({ dest: 'uploads/' })
```

`preservePath` yoqilganda Multer kelayotgan fayl nomini mijoz yuborgan barcha
yo'l segmentlari bilan birga o'tkazadi. Bu `file.originalname` sifatida taqdim etiladi;
u saqlash papkasini o'zgartirmaydi, papkalar yaratmaydi va yo'lni siz uchun
tozalamaydi. `file.originalname` har doim mijoz tomonidan yuboriladi va ishonchsiz
deb qaralishi kerak; `preservePath` bilan u qo'shimcha ravishda mijoz yuborgan yo'l
segmentlarini ham o'z ichiga oladi. Uni maxsus `filename` funksiyasida yoki saqlash
mexanizmida ishlatishdan oldin normallashtiring yoki tekshiring.

Yuklashlaringiz ustidan ko'proq nazoratga ega bo'lishni istasangiz, `dest` o'rniga
`storage` parametridan foydalanishingiz kerak. Multer `DiskStorage` va `MemoryStorage`
saqlash mexanizmlari bilan birga keladi; boshqa mexanizmlar uchinchi tomonlardan mavjud.

#### `.single(fieldname)`

`fieldname` nomli bitta faylni qabul qiladi. Bu bitta fayl
`req.file` da saqlanadi.

#### `.array(fieldname[, maxCount])`

Barchasi `fieldname` nomiga ega bo'lgan fayllar massivini qabul qiladi. Ixtiyoriy ravishda
`maxCount` dan ko'p fayl yuklansa, xatolik qaytaradi. Fayllar massivi
`req.files` da saqlanadi.

#### `.fields(fields)`

`fields` orqali ko'rsatilgan fayllar aralashmasini qabul qiladi. Fayllar massivlaridan iborat ob'ekt
`req.files` da saqlanadi.

`fields` — `name` va ixtiyoriy `maxCount` ga ega ob'ektlar massivi bo'lishi kerak.
Misol:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Faqat matnli maydonlarni qabul qiladi. Agar biror fayl yuklansa,
"LIMIT\_UNEXPECTED\_FILE" kodli xatolik chiqariladi.

#### `.any()`

Tarmoq orqali kelgan barcha fayllarni qabul qiladi. Fayllar massivi
`req.files` da saqlanadi.

**OGOHLANTIRISH:** Foydalanuvchi yuklagan fayllarni har doim qayta ishlashingizga ishonch hosil qiling.
Multerni hech qachon global middleware sifatida qo'shmang, chunki yovuz niyatli foydalanuvchi
siz kutmagan yo'nalishga (route) fayllar yuklashi mumkin. Bu funksiyani faqat yuklangan
fayllarni qayta ishlaydigan yo'nalishlarda ishlating.

### `storage`

#### `DiskStorage`

Diskka saqlash mexanizmi sizga fayllarni diskka saqlash ustidan to'liq nazorat beradi.

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

Ikkita parametr mavjud: `destination` va `filename`. Ularning ikkalasi ham
faylni qayerda saqlash kerakligini aniqlaydigan funksiyalardir.

`destination` yuklangan fayllar qaysi papkada saqlanishini aniqlash uchun
ishlatiladi. Uni `string` sifatida ham berish mumkin (masalan, `'/tmp/uploads'`). Agar
`destination` berilmasa, operatsion tizimning vaqtinchalik fayllar uchun standart
papkasi ishlatiladi.

**Eslatma:** `destination` ni funksiya sifatida berganingizda papkani yaratish
uchun o'zingiz javobgarsiz. Satr (string) berilganda esa multer papka siz uchun
yaratilishini ta'minlaydi.

`filename` papka ichida fayl qanday nomlanishini aniqlash uchun ishlatiladi.
Agar `filename` berilmasa, har bir faylga fayl kengaytmasisiz
tasodifiy nom beriladi.

**Eslatma:** Multer siz uchun hech qanday fayl kengaytmasini qo'shmaydi, funksiyangiz
fayl kengaytmasi bilan to'liq fayl nomini qaytarishi kerak.

Qaror qabul qilishga yordam berish uchun har bir funksiyaga so'rov (`req`) hamda fayl haqidagi
ba'zi ma'lumotlar (`file`) uzatiladi.

E'tibor bering, `req.body` hali to'liq to'ldirilmagan bo'lishi mumkin. Bu mijozning
maydonlar va fayllarni serverga qaysi tartibda yuborishiga bog'liq.

Callback'da ishlatiladigan chaqirish qoidasini (birinchi parametr sifatida
null uzatish zarurligini) tushunish uchun
[Node.js xatolarni qayta ishlash](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors) sahifasiga qarang

#### `MemoryStorage`

Xotirada saqlash mexanizmi fayllarni xotirada `Buffer` ob'ektlari sifatida saqlaydi. Uning
hech qanday parametrlari yo'q.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Xotirada saqlash ishlatilganda fayl ma'lumotlari butun faylni o'z ichiga olgan
`buffer` nomli maydonni o'z ichiga oladi.

**OGOHLANTIRISH**: Xotirada saqlash ishlatilganda juda katta fayllarni yoki nisbatan kichik
fayllarni ko'p miqdorda juda tez yuklash ilovangizning xotirasi
tugab qolishiga olib kelishi mumkin.

### `limits`

Quyidagi ixtiyoriy xususiyatlarning hajm chegaralarini belgilaydigan ob'ekt. Multer bu ob'ektni to'g'ridan-to'g'ri busboy'ga uzatadi va xususiyatlar tafsilotlarini [busboy sahifasida](https://github.com/mscdex/busboy#exports) topishingiz mumkin.

Quyidagi butun son qiymatlar mavjud:

Kalit | Ta'rif | Standart qiymat
--- | --- | ---
`fieldNameSize` | Maydon nomining maksimal hajmi | Infinity
`fieldSize` | Maydon qiymatining maksimal hajmi (baytlarda) | 1MB
`fields` | Fayl bo'lmagan maydonlarning maksimal soni | Infinity
`fileSize` | Multipart formalar uchun faylning maksimal hajmi (baytlarda) | Infinity
`files` | Multipart formalar uchun fayl maydonlarining maksimal soni | Infinity
`parts` | Multipart formalar uchun qismlarning maksimal soni (maydonlar + fayllar) | Infinity
`headerPairs` | Multipart formalar uchun tahlil qilinadigan sarlavha key=>value juftliklarining maksimal soni | 2000
`fieldNestingDepth` | Maydon nomlari uchun ichma-ichlik darajalarining maksimal soni (masalan, `a[b][c]` 2 darajaga ega) | Infinity
`fieldArrayIndexLimit` | Maydon nomi ichida qabul qilinadigan maksimal raqamli massiv indeksi (masalan, `a[3]` 3-indeksni ishlatadi) | Infinity

`parts` chegarasi busboy belgilangan qismlar soniga yetganda ishga tushadi,
faqat bu son oshib ketgandan keyin emas. Agar aniq miqdordagi maydonlar va fayllarga
ruxsat bermoqchi bo'lsangiz, `parts` ni shu umumiy sondan kamida bittaga ko'proq qilib belgilang.

Chegaralarni belgilash saytingizni xizmat ko'rsatishni rad etish (DoS) hujumlaridan himoya qilishga yordam beradi.

### `fileFilter`

Qaysi fayllar yuklanishi va qaysilari o'tkazib yuborilishi kerakligini boshqarish uchun
buni funksiya sifatida belgilang. Funksiya quyidagi ko'rinishda bo'lishi kerak:

```javascript
function fileFilter (req, file, cb) {

  // Funksiya faylni qabul qilish kerakligini bildirish uchun
  // `cb` ni boolean qiymat bilan chaqirishi kerak

  // Bu faylni rad etish uchun `false` uzating, quyidagicha:
  cb(null, false)

  // Faylni qabul qilish uchun `true` uzating, quyidagicha:
  cb(null, true)

  // Biror narsa noto'g'ri ketsa, har doim xatolik uzatishingiz mumkin:
  cb(new Error('I don\'t have a clue!'))

}
```

## Xavfsizlik

[Chegaralarni](#limits) belgilash saytingizni xizmat ko'rsatishni rad etish (DoS) hujumlaridan himoya qilishga yordam beradi. Ko'pchilik ilovalar uchun quyidagi chegaralar tavsiya etiladi:

- `fileSize` -- o'z holatingiz uchun kutilayotgan maksimal fayl hajmiga o'rnating
- `files` -- bitta so'rovdagi fayllarning maksimal soniga o'rnating
- `fields` -- bitta so'rovdagi matnli maydonlarning maksimal soniga o'rnating
- `fieldNestingDepth` -- maydon nomlaringiz talab qiladigan minimal chuqurlikka o'rnating (masalan, `a[b][c]` uchun `3`)
- `fieldArrayIndexLimit` -- maydon nomlaringiz talab qiladigan eng katta massiv indeksiga o'rnating (masalan, `a[99]` uchun `100`)

## Xatolarni qayta ishlash

Xatoga duch kelganda Multer xatoni Express'ga topshiradi. [Standart express usuli](https://expressjs.com/en/guide/error-handling/)dan
foydalanib chiroyli xato sahifasini ko'rsatishingiz mumkin.

Agar aynan Multer xatolarini ushlamoqchi bo'lsangiz, middleware funksiyasini
o'zingiz chaqirishingiz mumkin. Shuningdek, faqat [Multer xatolarini](https://github.com/expressjs/multer/blob/main/lib/multer-error.js) ushlamoqchi bo'lsangiz, `multer` ob'ektining o'ziga biriktirilgan `MulterError` klassidan foydalanishingiz mumkin (masalan, `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Yuklash vaqtida Multer xatoligi yuz berdi.
    } else if (err) {
      // Yuklash vaqtida noma'lum xatolik yuz berdi.
    }

    // Hammasi yaxshi o'tdi.
  })
})
```

## Maxsus saqlash mexanizmi

O'zingizning saqlash mexanizmingizni qanday yaratish haqida ma'lumot olish uchun [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md) sahifasiga qarang.

## Litsenziya

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
