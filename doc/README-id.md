# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer adalah middleware node.js untuk menangani `multipart/form-data`, yang terutama digunakan untuk mengunggah file. Middleware ini ditulis di atas [busboy](https://github.com/mscdex/busboy) untuk efisiensi maksimum.

**CATATAN**: Multer tidak akan memproses form yang bukan bertipe multipart (`multipart/form-data`).

## Terjemahan

README ini juga tersedia dalam bahasa lain:

* [English](https://github.com/expressjs/multer/blob/main/README.md)
* [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md) (Arabic)
* [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md) (Chinese)
* [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md) (French)
* [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md) (Korean)
* [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) (Portuguese BR)
* [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) (Russian)
* [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md) (Spanish)
* [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md) (Uzbek)
* [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md) (Vietnamese)
* [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md) (Turkish)

## Instalasi

```sh
$ npm install multer
```

## Penggunaan

Multer menambahkan objek `body` dan objek `file` atau `files` object ke objek `request` (biasanya ditulis sebagai `req`). Objek `body` berisi nilai dari kolom teks pada form, sedangkan objek `file` atau `files` berisi file yang diunggah melalui form tersebut.

Contoh penggunaan dasar:

Jangan lupa menambahkan atribut `enctype="multipart/form-data"` pada form HTML Anda.

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
  // req.body akan menampung kolom teks jika ada
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files adalah array dari file `photos`
  // req.body akan menampung kolom teks jika ada
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files adalah objek (String -> Array) dengan fieldname sebagai key, dan array of files sebagai nilainya
  //
  // contoh:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body akan menampung kolom teks jika ada
})
```

Jika Anda hanya perlu menangani form multipart yang berisi teks saja (tanpa file), Anda harus menggunakan metode `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body berisi kolom teks
})
```

Berikut adalah contoh bagaimana multer digunakan dalam form HTML. Perhatikan baik-baik bagian atribut `enctype="multipart/form-data"` dan kolom `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Kemudian pada file javascript, Anda dapat menambahkan baris berikut untuk mengakses file dan data teks. Penting untuk memastikan nilai atribut `name` dari form HTML sama dengan argumen di fungsi upload Anda. Ini memberitahu multer kolom mana pada request yang harus dicari file-nya. Jika kolom ini tidak sama, proses unggah Anda akan gagal:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file adalah nama file Anda di form atas, di sini adalah 'uploaded_file'
  // req.body akan menampung kolom teks jika ada
  console.log(req.file, req.body)
});
```

## API

### Informasi file

Setiap objek file berisi informasi berikut:

Key | Deskripsi | Catatan
--- | --- | ---
`fieldname` | Nama kolom yang ditentukan pada form |
`originalname` | Nama file di komputer pengguna, atau path lengkap saat `preservePath: true` |
`encoding` | Tipe encoding file |
`mimetype` | Mime type file |
`size` | Ukuran file dalam satuan byte |
`destination` | Folder tempat file disimpan | `DiskStorage`
`filename` | Nama file di dalam folder `destination` | `DiskStorage`
`path` | Path lengkap ke file yang diunggah | `DiskStorage`
`buffer` | Objek `Buffer` dari seluruh file | `MemoryStorage`

### `multer(opts)`

Multer menerima objek opsi (*options object*), dengan opsi paling dasar adalah properti `dest`, yang menentukan folder tempat menyimpan file. Jika Anda mengosongkan objek opsi ini, file akan disimpan di memori (RAM) dan tidak akan pernah ditulis ke disk.

Secara default, Multer akan mengganti nama file untuk menghindari bentrokan nama. Fungsi penggantian nama ini dapat disesuaikan dengan kebutuhan Anda.

Berikut adalah opsi yang dapat diberikan pada Multer:

Key | Deskripsi
--- | ---
`dest` or `storage` | Tempat menyimpan file
`fileFilter` | Fungsi untuk mengontrol file mana saja yang diterima
`limits` | Batas ukuran/jumlah data yang diunggah
`preservePath` | Mempertahankan path lengkap file, bukan hanya nama dasarnya saja (*base name*)
`defParamCharset` | Karakter set default yang digunakan untuk nilai parameter header bagian (seperti nama file) yang bukan parameter ekstensi (yang berisi karakter set eksplisit). Default: `'latin1'`

Pada aplikasi web standar, umumnya hanya opsi `dest` yang diperlukan, seperti yang ditunjukkan pada contoh berikut:

```javascript
const upload = multer({ dest: 'uploads/' })
```

Ketika `preservePath` diaktifkan, Multer meneruskan nama file yang masuk beserta segmen path yang diberikan oleh klien. Ini diekspos sebagai `file.originalname`; ini tidak mengubah folder tujuan, tidak membuat direktori, atau membersihkan path untuk Anda. `file.originalname` selalu berasal dari klien dan harus diperlakukan sebagai tidak tepercaya; dengan `preservePath`, ini juga berisi segmen path yang dikirim klien. Normalisasi atau validasi sebelum menggunakannya dalam `filename` khusus atau mesin penyimpanan.

Jika Anda menginginkan kontrol lebih besar pada proses unggah, gunakan opsi `storage` alih-alih `dest`. Multer dilengkapi dengan mesin penyimpanan bawaan `DiskStorage` dan `MemoryStorage`; mesin penyimpanan lainnya juga tersedia dari pihak ketiga.

#### `.single(fieldname)`

Menerima satu file dengan nama kolom `fieldname`. File tersebut akan disimpan di `req.file`.

#### `.array(fieldname[, maxCount])`

Menerima array file yang semuanya memiliki nama kolom `fieldname`. Secara opsional akan menghasilkan error jika jumlah file yang diunggah melebihi `maxCount`. Array file tersebut akan disimpan di `req.files`.

#### `.fields(fields)`

Menerima campuran file yang ditentukan oleh `fields`. Objek berisi array file akan disimpan di `req.files`.

`fields` harus berupa array objek yang berisi `name` dan secara opsional `maxCount`. Contoh:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Hanya menerima kolom teks. Jika ada file yang diunggah, error dengan kode "LIMIT\_UNEXPECTED\_FILE" akan muncul.

#### `.any()`

Menerima semua file yang dikirimkan. Array file akan disimpan di `req.files`.

**PERINGATAN:** Pastikan Anda selalu menangani file yang diunggah pengguna. Jangan pernah menambahkan multer sebagai middleware global, karena pengguna berbahaya bisa saja mengunggah file ke rute yang tidak Anda duga. Gunakan fungsi ini hanya pada rute tempat Anda menangani file unggahan.

### `storage`

#### `DiskStorage`

Mesin penyimpanan disk (*disk storage engine*) memberi Anda kontrol penuh untuk menyimpan file ke disk.

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

Terdapat dua opsi yang tersedia, yaitu `destination` dan `filename`. Keduanya merupakan fungsi yang menentukan di mana file harus disimpan.

`destination` digunakan untuk menentukan di folder mana file unggahan akan disimpan. Opsi ini juga bisa diberikan berupa `string` (misalnya `'/tmp/uploads'`). Jika tidak ada `destination` yang ditentukan, direktori default sistem operasi untuk file sementara (*temporary files*) akan digunakan.

**Catatan:** Anda bertanggung jawab untuk membuat direktori tersebut jika menyediakan `destination` as a function. Ketika Anda memberikan berupa string, multer akan memastikan direktori tersebut dibuat untuk Anda.

`filename` digunakan untuk menentukan nama file di dalam folder tersebut. Jika tidak ada `filename` yang ditentukan, setiap file akan diberikan nama acak tanpa ekstensi file.

**Catatan:** Multer tidak akan menambahkan ekstensi file secara otomatis, fungsi Anda harus mengembalikan nama file lengkap beserta ekstensinya.

Setiap fungsi akan menerima parameter request (`req`) dan informasi tentang file (`file`) untuk membantu pengambilan keputusan.

Perlu dicatat bahwa `req.body` mungkin belum sepenuhnya terisi. Ini bergantung pada urutan pengiriman kolom teks dan file dari client ke server.

Untuk memahami konvensi pemanggilan yang digunakan pada callback (perlu mengirimkan `null` sebagai parameter pertama), lihat [Penanganan error Node.js](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors).

#### `MemoryStorage`

Mesin penyimpanan memori (*memory storage engine*) menyimpan file di memori sebagai objek `Buffer`. Penyimpanan ini tidak memiliki opsi konfigurasi apa pun.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Saat menggunakan penyimpanan memori, informasi file akan berisi kolom `buffer` yang menampung seluruh isi file.

**PERINGATAN**: Mengunggah file yang sangat besar, atau file berukuran sedang dalam jumlah banyak secara bersamaan, dapat menyebabkan aplikasi Anda kehabisan memori jika menggunakan penyimpanan memori.

### Batas (limits)

Sebuah objek yang menentukan batas ukuran dari properti opsional berikut. Multer meneruskan objek ini langsung ke busboy, dan detail propertinya dapat ditemukan di [halaman busboy](https://github.com/mscdex/busboy#busboy-methods).

Tersedia nilai integer berikut:

Key | Deskripsi | Default
--- | --- | ---
`fieldNameSize` | Ukuran maksimum nama kolom | 100 byte
`fieldSize` | Ukuran maksimum nilai kolom (dalam byte) | 1MB
`fields` | Jumlah maksimum kolom non-file | Infinity
`fileSize` | Ukuran file maksimum untuk form multipart (dalam byte) | Infinity
`files` | Jumlah maksimum kolom file untuk form multipart | Infinity
`parts` | Jumlah maksimum bagian (kolom teks + file) untuk form multipart | Infinity
`headerPairs` | Jumlah maksimum pasangan key=>value header yang diurai untuk form multipart | 2000
`fieldNestingDepth` | Jumlah kedalaman tingkat bertingkat maksimum untuk nama kolom (misal: `a[b][c]` memiliki 2 tingkat) | Infinity

Menentukan batas ini dapat membantu melindungi situs Anda dari serangan Denial of Service (DoS).

### `fileFilter`

Gunakan opsi ini berupa fungsi untuk mengontrol file mana saja yang harus diunggah dan mana yang harus diabaikan. Contoh fungsi tersebut seperti ini:

```javascript
function fileFilter (req, file, cb) {

  // Fungsi ini harus memanggil `cb` dengan nilai boolean
  // untuk menentukan apakah file diterima atau tidak

  // Untuk menolak file ini, kirim `false` seperti ini:
  cb(null, false)

  // Untuk menerima file ini, kirim `true` seperti ini:
  cb(null, true)

  // Anda selalu dapat mengirimkan error jika terjadi kesalahan:
  cb(new Error('Pesan kesalahan Anda'))

}
```

## Keamanan

Menentukan opsi [batas (limits)](#batas-limits) dapat membantu melindungi situs Anda dari serangan Denial of Service (DoS). Batas berikut direkomendasikan untuk sebagian besar aplikasi:

- `fileSize` -- sesuaikan dengan ukuran file maksimum yang diharapkan untuk kasus penggunaan Anda
- `files` -- batasi jumlah maksimum file per request
- `fields` -- batasi jumlah maksimum kolom teks per request
- `fieldNestingDepth` -- batasi kedalaman nama kolom minimum yang dibutuhkan aplikasi Anda (misalnya `3` untuk `a[b][c]`)

## Penanganan Error

Ketika terjadi error, Multer akan meneruskan error tersebut ke Express. Anda dapat menampilkan halaman error yang menarik menggunakan [cara standar Express](http://expressjs.com/guide/error-handling.html).

Jika Anda ingin menangani error secara spesifik dari Multer saja, Anda dapat memanggil fungsi middleware secara manual. Selain itu, jika Anda ingin menangkap hanya [error dari Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js), Anda dapat menggunakan kelas `MulterError` yang disertakan pada objek `multer` itu sendiri (misalnya `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Terjadi error dari Multer saat mengunggah.
    } else if (err) {
      // Terjadi error tidak dikenal lainnya saat mengunggah.
    }

    // Semua berjalan lancar.
  })
})
```

## Custom Storage Engine

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
