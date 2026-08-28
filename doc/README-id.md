# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer adalah middleware node.js untuk menangani `multipart/form-data`, yang terutama digunakan untuk mengunggah file. Middleware ini ditulis
di atas [busboy](https://github.com/mscdex/busboy) untuk efisiensi maksimum.

**CATATAN**: Multer tidak akan memproses form yang bukan bertipe multipart (`multipart/form-data`).

## Terjemahan

README ini juga tersedia dalam bahasa lain:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | Inggris         |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Arab            |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Mandarin (Sederhana) |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | Prancis         |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | Jepang          |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | Korea           |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Portugis (BR)   |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Rusia           |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | Spanyol         |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | Tamil           |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | Uzbek           |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | Vietnam         |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | Turki           |


## Instalasi

```sh
$ npm install multer
```

## Penggunaan

Multer menambahkan objek `body` dan objek `file` atau `files` ke objek `request`. Objek `body` berisi nilai dari kolom teks pada form, sedangkan objek `file` atau `files` berisi file yang diunggah melalui form tersebut.

Contoh penggunaan dasar:

Jangan lupa menambahkan `enctype="multipart/form-data"` pada form Anda.

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
  // req.file adalah file `avatar`
  // req.body akan menampung kolom teks, jika ada
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files adalah array dari file `photos`
  // req.body akan berisi kolom teks, jika ada
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files adalah objek (String -> Array) dengan fieldname sebagai key, dan nilainya adalah array file
  //
  // contoh:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body akan berisi kolom teks, jika ada
})
```

Jika Anda perlu menangani form multipart yang hanya berisi teks, gunakan metode `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body berisi kolom teks
})
```

Berikut adalah contoh bagaimana multer digunakan dalam form HTML. Perhatikan baik-baik bagian `enctype="multipart/form-data"` dan kolom `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Kemudian pada file javascript Anda, tambahkan baris berikut untuk mengakses file maupun body. Penting untuk menggunakan nilai kolom `name` dari form tersebut di fungsi unggah Anda. Nilai inilah yang memberi tahu multer kolom mana pada request yang harus dicari file-nya. Jika kolom ini tidak sama antara form HTML dan server Anda, proses unggah akan gagal:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file adalah nama file Anda pada form di atas, di sini 'uploaded_file'
  // req.body akan menampung kolom teks, jika ada
  console.log(req.file, req.body)
});
```



## API

### Informasi file

Setiap file berisi informasi berikut:

Key | Deskripsi | Catatan
--- | --- | ---
`fieldname` | Nama kolom yang ditentukan pada form |
`originalname` | Nama file di komputer pengguna, atau path lengkapnya jika `preservePath: true` |
`encoding` | Tipe encoding file |
`mimetype` | Mime type file |
`size` | Ukuran file dalam byte |
`destination` | Folder tempat file disimpan | `DiskStorage`
`filename` | Nama file di dalam folder `destination` | `DiskStorage`
`path` | Path lengkap ke file yang diunggah | `DiskStorage`
`buffer` | `Buffer` dari seluruh isi file | `MemoryStorage`

### `multer(opts)`

Multer menerima sebuah objek opsi, yang paling dasar di antaranya adalah properti
`dest`, yang memberi tahu Multer ke mana file harus diunggah. Jika Anda tidak
memberikan objek opsi, file akan disimpan di memori dan tidak akan pernah ditulis ke disk.

Secara default, Multer akan mengganti nama file untuk menghindari bentrokan nama.
Fungsi penggantian nama ini dapat disesuaikan dengan kebutuhan Anda.

Berikut adalah opsi yang dapat diberikan kepada Multer.

Key | Deskripsi
--- | ---
`dest` or `storage` | Tempat menyimpan file
`fileFilter` | Fungsi untuk mengontrol file mana saja yang diterima
`limits` | Batas data yang diunggah
`preservePath` | Mempertahankan path lengkap yang dikirim client di `file.originalname`, bukan hanya nama dasarnya saja
`defParamCharset` | Set karakter default yang digunakan untuk nilai parameter header bagian (misalnya filename) yang bukan parameter extended (yang menyertakan charset secara eksplisit). Default: `'latin1'`

Pada aplikasi web pada umumnya, biasanya hanya `dest` yang diperlukan, dan dikonfigurasi seperti
pada contoh berikut.

```javascript
const upload = multer({ dest: 'uploads/' })
```

Ketika `preservePath` diaktifkan, Multer meneruskan nama file yang masuk beserta
segmen path apa pun yang diberikan oleh client. Nilai ini diekspos sebagai `file.originalname`;
opsi ini tidak mengubah folder tujuan, tidak membuat direktori, dan tidak membersihkan
path tersebut untuk Anda. `file.originalname` selalu berasal dari client dan harus diperlakukan
sebagai data yang tidak tepercaya; dengan `preservePath`, nilai ini juga berisi segmen path yang
dikirim client. Normalisasi atau validasi nilai tersebut sebelum menggunakannya di `filename` kustom
atau mesin penyimpanan.

Jika Anda menginginkan kontrol lebih besar atas proses unggah, gunakan opsi `storage`
alih-alih `dest`. Multer dilengkapi dengan mesin penyimpanan `DiskStorage`
dan `MemoryStorage`; mesin penyimpanan lainnya tersedia dari pihak ketiga.

#### `.single(fieldname)`

Menerima satu file dengan nama `fieldname`. File tunggal tersebut akan disimpan
di `req.file`.

#### `.array(fieldname[, maxCount])`

Menerima array file yang semuanya memiliki nama `fieldname`. Secara opsional menghasilkan error jika
jumlah file yang diunggah melebihi `maxCount`. Array file tersebut akan disimpan di
`req.files`.

#### `.fields(fields)`

Menerima campuran file yang ditentukan oleh `fields`. Sebuah objek berisi array file
akan disimpan di `req.files`.

`fields` harus berupa array objek yang berisi `name` dan secara opsional `maxCount`.
Contoh:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Hanya menerima kolom teks. Jika ada file yang diunggah, error dengan kode
"LIMIT\_UNEXPECTED\_FILE" akan dikeluarkan.

#### `.any()`

Menerima semua file yang dikirimkan. Array file akan disimpan di
`req.files`.

**PERINGATAN:** Pastikan Anda selalu menangani file yang diunggah pengguna.
Jangan pernah menambahkan multer sebagai middleware global, karena pengguna jahat dapat mengunggah
file ke rute yang tidak Anda duga. Gunakan fungsi ini hanya pada rute
tempat Anda menangani file unggahan.

### `storage`

#### `DiskStorage`

Mesin penyimpanan disk memberi Anda kontrol penuh untuk menyimpan file ke disk.

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

Terdapat dua opsi yang tersedia, yaitu `destination` dan `filename`. Keduanya merupakan
fungsi yang menentukan di mana file harus disimpan.

`destination` digunakan untuk menentukan di folder mana file unggahan harus
disimpan. Opsi ini juga bisa diberikan berupa `string` (misalnya `'/tmp/uploads'`). Jika tidak ada
`destination` yang diberikan, direktori default sistem operasi untuk file sementara
akan digunakan.

**Catatan:** Anda bertanggung jawab untuk membuat direktori tersebut jika memberikan
`destination` berupa fungsi. Jika Anda memberikan string, multer akan memastikan
direktori tersebut dibuat untuk Anda.

`filename` digunakan untuk menentukan nama file di dalam folder tersebut.
Jika tidak ada `filename` yang diberikan, setiap file akan diberi nama acak tanpa
ekstensi file apa pun.

**Catatan:** Multer tidak akan menambahkan ekstensi file apa pun untuk Anda; fungsi Anda
harus mengembalikan nama file lengkap beserta ekstensinya.

Setiap fungsi menerima request (`req`) dan sejumlah informasi tentang
file (`file`) untuk membantu pengambilan keputusan.

Perlu dicatat bahwa `req.body` mungkin belum sepenuhnya terisi. Hal ini bergantung pada
urutan pengiriman kolom dan file dari client ke server.

Untuk memahami konvensi pemanggilan yang digunakan pada callback (perlu mengirimkan
null sebagai parameter pertama), lihat
[Penanganan error Node.js](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Mesin penyimpanan memori menyimpan file di memori sebagai objek `Buffer`. Mesin ini
tidak memiliki opsi apa pun.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Saat menggunakan penyimpanan memori, informasi file akan berisi kolom bernama
`buffer` yang menampung seluruh isi file.

**PERINGATAN**: Mengunggah file yang sangat besar, atau file berukuran relatif kecil dalam
jumlah banyak dengan sangat cepat, dapat menyebabkan aplikasi Anda kehabisan memori jika
penyimpanan memori digunakan.

### `limits`

Sebuah objek yang menentukan batas ukuran dari properti opsional berikut. Multer meneruskan objek ini langsung ke busboy, dan detail propertinya dapat ditemukan di [halaman busboy](https://github.com/mscdex/busboy#exports).

Tersedia nilai integer berikut:

Key | Deskripsi | Default
--- | --- | ---
`fieldNameSize` | Ukuran maksimum nama kolom | Infinity
`fieldSize` | Ukuran maksimum nilai kolom (dalam byte) | 1MB
`fields` | Jumlah maksimum kolom non-file | Infinity
`fileSize` | Untuk form multipart, ukuran file maksimum (dalam byte) | Infinity
`files` | Untuk form multipart, jumlah maksimum kolom file | Infinity
`parts` | Untuk form multipart, jumlah maksimum bagian (kolom + file) | Infinity
`headerPairs` | Untuk form multipart, jumlah maksimum pasangan key=>value header yang diurai | 2000
`fieldNestingDepth` | Jumlah maksimum tingkat bersarang untuk nama kolom (misalnya `a[b][c]` memiliki 2 tingkat) | Infinity
`fieldArrayIndexLimit` | Indeks array numerik maksimum yang diterima di dalam nama kolom (misalnya `a[3]` menggunakan indeks 3) | Infinity

Batas `parts` terpicu ketika busboy mencapai jumlah bagian yang dikonfigurasi,
bukan hanya setelah jumlah tersebut terlampaui. Jika Anda ingin mengizinkan jumlah
kolom dan file yang tepat, atur `parts` setidaknya satu lebih besar dari total tersebut.

Menentukan batas ini dapat membantu melindungi situs Anda dari serangan denial of service (DoS).

### `fileFilter`

Atur opsi ini berupa fungsi untuk mengontrol file mana yang harus diunggah dan mana
yang harus dilewati. Fungsi tersebut harus terlihat seperti ini:

```javascript
function fileFilter (req, file, cb) {

  // Fungsi ini harus memanggil `cb` dengan sebuah boolean
  // untuk menandakan apakah file tersebut diterima

  // Untuk menolak file ini, kirimkan `false`, seperti ini:
  cb(null, false)

  // Untuk menerima file ini, kirimkan `true`, seperti ini:
  cb(null, true)

  // Anda selalu dapat mengirimkan error jika terjadi kesalahan:
  cb(new Error('I don\'t have a clue!'))

}
```

## Keamanan

Menentukan [limits](#limits) dapat membantu melindungi situs Anda dari serangan denial of service (DoS). Batas berikut direkomendasikan untuk sebagian besar aplikasi:

- `fileSize` -- atur ke ukuran file maksimum yang diharapkan untuk kasus penggunaan Anda
- `files` -- atur ke jumlah maksimum file per request
- `fields` -- atur ke jumlah maksimum kolom teks per request
- `fieldNestingDepth` -- atur ke kedalaman minimum yang dibutuhkan nama kolom Anda (misalnya `3` untuk `a[b][c]`)
- `fieldArrayIndexLimit` -- atur ke indeks array terbesar yang dibutuhkan nama kolom Anda (misalnya `100` untuk `a[99]`)

## Penanganan error

Ketika terjadi error, Multer akan meneruskan error tersebut ke Express. Anda dapat
menampilkan halaman error yang rapi menggunakan [cara standar express](https://expressjs.com/en/guide/error-handling/).

Jika Anda ingin menangkap error yang secara khusus berasal dari Multer, Anda dapat memanggil
fungsi middleware-nya sendiri. Selain itu, jika Anda hanya ingin menangkap [error Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js), Anda dapat menggunakan kelas `MulterError` yang disertakan pada objek `multer` itu sendiri (misalnya `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Terjadi error Multer saat mengunggah.
    } else if (err) {
      // Terjadi error yang tidak dikenal saat mengunggah.
    }

    // Semuanya berjalan lancar.
  })
})
```

## Mesin penyimpanan kustom

Untuk informasi tentang cara membuat mesin penyimpanan Anda sendiri, lihat [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md).

## Lisensi

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
