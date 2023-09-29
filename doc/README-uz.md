# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer - bu nodejs middleware bo'lib, asosan `multipart/form-data` shaklda yuborilgan fayllarni yuklashda ishlatiladi. Yuqori samaradorlikka erishish uchun [busboy](https://github.com/mscdex/busboy)ning ustiga yozilgan.

**Muhim**: Multer `multipart` bo'lmagan har qanday formani qayta ishlamaydi.

## Tarjimalar 

Bu README boshqa tillarda ham mavjud:

- [العربية](https://github.com/expressjs/multer/blob/master/doc/README-ar.md) (arabcha)
- [English](https://github.com/expressjs/multer/blob/master/README.md) (inglizcha)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (ispancha)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (xitoycha)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (korescha)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (portugalcha)
-  [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (ruscha)
- [Français](https://github.com/expressjs/multer/blob/master/doc/README-fr.md) (fransuzcha)


## O'rnatish

```sh
$ npm install --save multer
```

## Foydalanish

Multer - `request` ob'ektiga `body` va `file` yoki `files` ob'ektini qo'shadi. `body` ob'ekti formaning matn maydonlarining (fields) qiymatlarini o'z ichiga oladi, `file` yoki `files` ob'ekti forma orqali yuklangan fayllarni o'z ichiga oladi.

Sodda ishlatish uchun namuna:

Formada `enctype="multipart/form-data"` qo'shish esdan chiqmasin

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
  // req.file - fayl `avatar`
  // req.body agar matnli maydonlar (fields) bo'lsa, ularni saqlanadi
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files - fayllar massivi `photos`
  // req.body agar matnli maydonlar (fields) bo'lsa, ularni saqlanadi
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files - bu ob'ekt (String -> Array), matn maydoni(fieldname) - bu key, va qiymat - fayllar massivi
  //
  // misol:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body agar matnli maydonlar (fields) bo'lsa, ularni saqlanadi
})
```

Agarda siz faqat matndan iborat multipart form bilan ishlashingiz kerak bo'lsa,  `.none()` ishlating:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body matnli maydonlar (fields)ni o'zida saqlaydi
})
```

## API

### Fayl haqida ma'lumot

Har bir fayl quyidagi ma'lumotlarni o'zida saqlaydi:

Kalit(key) | Ta'rif                                 | Eslatma
--- |----------------------------------------| ---
`fieldname` | Formada berilgan maxsus nom            |
`originalname` | Foydalanuvchi kompyuteridagi fayl nomi |
`encoding` | Faylning kodlash turi                  |
`mimetype` | Faylning `mime` turi                   |
`size` | Fayl hajmi - baytda                    |
`destination` | Fayl saqlangan papka                   | `DiskStorage`
`filename` | `destination`ni ichidagi fayl nomi     | `DiskStorage`
`path` | Yuklangan faylning to'liq yo'li        | `DiskStorage`
`buffer` | Butun boshli fayl `Buffer` tipda       | `MemoryStorage`

### `multer(opts)`

Multer qo'shimcha ob'ekt qabul qiladi, ulardan eng asosiysi - `dest`, 
Multerga fayllarni qayerga yuklash kerakligini aytadigan xususiyat. Agarda siz qo'shimcha(`options`) ob'ektni tashlab ketsangiz, fayllar xotirada saqlanadi va hech qachon diskka yozilmaydi.

Standart holatda - Multer nomlashda kelib chiqishi mumkin bo'lgan muammolarni oldini olish uchun fayllar nomini o'zgartiradi. O'z talablaringizga mos ravishda nomlash funksiyasini sozlay olashingiz mumkin.

Quyidagilar Multerga qo'shimcha qiymat sifati berilishi mumkin:

Kalit(key) | Ta'rif
--- | ---
`dest` yoki `storage` | Faylni qayerda saqlash
`fileFilter` | Qaysi fayllar qabul qilinishini boshqarish funksiyasi
`limits` | Yuklash chegarasi
`preservePath` | Asosiy nom o'rniga fayllarning to'liq yo'lini saqlash

O'rtacha veb-ilovada faqat `dest` kerak bo'lishi mumkin va quyidagicha sozlanishi mumkin

```javascript
const upload = multer({ dest: 'uploads/' })
```
Yuklamalaringizni boshqarishda ko'proq nazoratni xohlasangiz, `dest` o'rniga `storage` tanlovini ishlatishingiz kerak. Multer `DiskStorage` va `MemoryStorage` saqlash motorlari(engines) bilan keladi. Boshqa motorlar(engines) uchun uchinchi tomondan(third parties) ko'proq tanlovlar keladi.

#### `.single(fieldname)`

`fieldname` nomi bilan yagona faylni qabul qiladi. Yagona fayl `req.file` da saqlanadi.

#### `.array(fieldname[, maxCount])`

`fieldname` nomi bilan fayllar massivini qabul qiladi. Agar `maxCount` dan ko'p fayl yuklash urinishi bo'lsa, hatolikni aniqlash imkoniyatini berish mumkin. Fayllar massivi `req.files` da saqlanadi.

#### `.fields(fields)`

`fields`da aniqlangan fayllarni qabul qiladi. Fayllar massivini saqlash uchun `req.files` ichidagi massivda saqlanadi.

`fields` ob'ektida `name` va `maxCount` kalitlar(keys)ni o'z ichiga olishi kerak. Misol:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Faqatgina matnli maydonlar(fields)ni oladi. Agarda biror fayl yuklansa, "LIMIT\_UNEXPECTED\_FILE" xatoligi yuboriladi.

#### `.any()`

Ushbu so'rov barcha fayllarni qabul qiladi, fayllar `req.files` ichida saqlanadi.

**OGOHLANTIRISH:** Foydalanuvchi yuklagan fayllarni doimo boshqarib turishni unutmang. Ularni boshqa yo'l(route)ni kutmagan holda fayllarini yuklash imkonini beradigan global middleware sifatida multerni sozlamang. Faqatgina yuklangan fayllarni boshqarish kerak bo'lgan yo'l(route)larda ushbu funksiyani ishlating.

### `storage`

#### `DiskStorage`

Diskka saqlash motori(engine) sizga fayllarni saqlashda to'liq nazorat qilish imkonini beradi. 

```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

const upload = multer({ storage: storage })
```

`destination` va `filename` qo'shimcha tanlovlari mavjud, ular ikkala ham qaysi papkada faylni saqlash kerakligini aniqlab turadigan funksiyalardir.

`destination` yuklangan fayllarni qaysi papkada saqlash kerakligini aniqlab turadi. Bu, `string` sifatida berilishi mumkin (masalan, `'/tmp/uploads'`). Agar `destination` berilmagan bo'lsa, operatsion tizimning vaqtinchalik fayllar uchun ishlatiladigan papkasini ishlatadi.

**Diqqat:** `destination` ni funksiya sifatida berib bo'lganda papka ochilganligiga o'zingiz javobgar bo'lasiz. Agar `string` sifatida bersangiz, multer papkani o'zi uchun yaratishni ta'minlaydi.

`filename` faylni papka ichida qanday nomlanganligini aniqlaydi. Agar `filename` berilmagan bo'lsa, har bir faylga fayl kengaytmasini o'z ichiga olmagan tasodifiy nom beriladi.

**Diqqat:** Multer siz uchun fayl kengaytmasini qo'shmaydi, sizning funksiyangiz kengaytma bilan to'liq nomni qaytarishi kerak.

Har bir funksiya `req` so'rovini va fayl haqida ma'lumotlarni (`file`) olish uchun o'tkaziladi.

Diqqat qiling, `req.body` hali to'liq to'ldirilmagan bo'lishi mumkin. Bu mijozning maydon(field)larni va fayllarni serverga qanday yuborishiga bog'liq bo'ladi.

Callback funktsiyasida ishlatiladigan chaqirish tartibini tushunish uchun (birinchi parametr sifatida null o‘tkazish talab etilishi) ko‘rish uchun quyidagi manzilga murojaat qiling:
[Node.js da xatoliklarni ushlash](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Xotira saqlash motori fayllarni xotirada `Buffer` ob'ektlar sifatida saqlaydi. Uning qo'shimcha qiymatlari yo‘q.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```
Xotirada saqlash paytida, fayl ma'lumotlari `buffer` deb nomlanadigan maydonni o‘z ichiga oladi.

**DIQQAT:** Juda katta fayllarni yuklash, yoki kichik fayllarni tez-tez yuklash, xotirada saqlash ishlatilganda, sizning ilovangizning xotirasini to'ldirib qo'yishi mumkin.

### `limits`

Quyidagi xususiyatlar o'lchov(limit)larni aniqlaydigan obyekt. Multer ushbu obyektni to'g'ridan-to'g'ri busboy ga o'tkazadi va xususiyatlar tafsilotlari [busboy sahifasida](https://github.com/mscdex/busboy#busboy-methods)dan topishingiz mumkin. 

Quyidagi butun qiymatlar mavjud:

Kalit(key) | Ta'rif                                                                                      | Odatiy qiymat
--- |---------------------------------------------------------------------------------------------| ---
`fieldNameSize` | Maksimal maydon nomi o'lchami                                                               | 100 bayt
`fieldSize` | Maksimal maydon qiymati o'lchami (baytlarda)                                                | 1MB
`fields` | Fayl bo'lmagan  maydonlarning maksimal soni                                                 | Cheklanmagan
`fileSize` | Multipart form uchun faylning maksimal o'lchami (baytda)                        | Cheklanmagan
`files` | Multipart form uchun fayllar sonining maksimal chegarasi                        | Cheklanmagan
`parts` | Multipart form uchun fayllar sonining maksimal chegarasi (fieldlar va fayllar)  | Cheklanmagan
`headerPairs` | Multipart form uchun ma'lumotlar (kalit va qiymat juftliklari) sonining maksimal chegarasi | 2000

Chegaralarni sozlash, DoS-hujumlariga qarshi saytingizni himoya qilishga yordam bera olishi mumkin

### `fileFilter`

Bu, qaysi fayllarni yuklashi, qaysilarini o'tkazib yuborish kerakligini boshqarish uchun funksiya sifatida sozlasa bo'ladi. Funksiya quyidagi ko'rinishda bo'lishi kerak:"

```javascript
function fileFilter (req, file, cb) {

  // Bu funksiya, faylni qabul qilish kerakligini anglatish uchun `cb` ni 
  // boolean qiymat bilan chaqirish kerak.

  // Faylni qabul qilishni rad etish uchun false quyudagicha berilishi kerak:
  cb(null, false)

  // Faylni qabul qiilishni tasdiqlash uchun true quyudagicha berilishi kerak:
  cb(null, true)

  // Nimadir xato ketsa, siz har doim  Error berishingiz mumkin:
  cb(new Error('I don\'t have a clue!'))

}
```

## Xatolar bilan ishlash

Xatoga duch kelganda, Multer xatoni Expressga yuboradi. [standart express usuli](http://expressjs.com/guide/error-handling.html)dan foydalanib xatoni tartibliroq chiqarishingiz mumkin.

Agar siz Multerdan chiqqan xatolarni aniqlamoqchi bo'lsangiz o'zingiz `middleware` funksiya yozishingiz mumkin. Shuningdek, agar siz faqat [Multer xatolarini](https://github.com/expressjs/multer/blob/master/lib/multer-error.js) ushlamoqchi bo'lsangiz, siz `multer` ob'ektiga yozilgan `MulterError` class ni ishlatishingiz mumkin (masalan, `err instanceof multer.MulterError`).


```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Yuklanishda Multerdan xatolik yuz berganda.
    } else {
      // Yuklanishda noma'lum xatolik yuz berganda.
    }

    // Hammasi muvaffaqqiyatli bo'lganda.
  })
})
```

## Maxsus saqlash mexanizmi

O'zingizning saqlash dvigatelingizni qanday yaratish haqida ma'lumot olish: [Maxsus saqlash mexanizmi](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## Litsenziya

[MIT](LICENSE)
