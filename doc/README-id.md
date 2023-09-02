# Multer [![Status Pembangunan](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![Versi NPM](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![Gaya Kode JS Standar](https://img.shields.io/badge/style%20kode-standar-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer adalah middleware node.js untuk menangani `multipart/form-data`, yang utamanya digunakan untuk mengunggah file. Ini ditulis
di atas [busboy](https://github.com/mscdex/busboy) untuk efisiensi maksimum.

**CATATAN**: Multer tidak akan memproses formulir apa pun yang bukan merupakan `multipart/form-data`.

## Terjemahan

README ini juga tersedia dalam bahasa-bahasa lain:

- [Bahasa Indonesia](https://github.com/expressjs/multer/blob/master/doc/README-id.md) (Indonesia)
- [العربية](https://github.com/expressjs/multer/blob/master/doc/README-ar.md) (Arabic)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (Spanish)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (Chinese)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (Korean)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (Russian)
- [Việt Nam](https://github.com/expressjs/multer/blob/master/doc/README-vi.md) (Vietnam)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (Portuguese Brazil)
- [Français](https://github.com/expressjs/multer/blob/master/doc/README-fr.md) (French)

## Instalasi

```sh
$ npm install --save multer
```

## Penggunaan

Multer menambahkan objek `body` dan objek `file` atau `files` ke dalam objek `request`. Objek `body` berisi nilai-nilai dari bidang teks formulir, objek `file` atau `files` berisi file yang diunggah melalui formulir.

Contoh penggunaan dasar:

Jangan lupakan `enctype="multipart/form-data"` di formulir Anda.

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
  // req.body akan berisi bidang teks, jika ada
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files adalah array file `photos`
  // req.body akan berisi bidang teks, jika ada
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files adalah objek (String -> Array) di mana fieldname adalah kunci, dan nilai adalah array file
  //
  // misalnya
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body akan berisi bidang teks, jika ada
})
```

Jika Anda perlu menangani formulir multipart teks saja, Anda harus menggunakan metode `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body berisi bidang teks
})
```

Berikut adalah contoh penggunaan multer dalam formulir HTML. Perhatikan khususnya `enctype="multipart/form-data"` dan bidang `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Jumlah pembicara" name="nspeakers">
    <input type="submit" value="Dapatkan statistik!" class="btn btn-default">
  </div>
</form>
```

Kemudian di file JavaScript Anda akan menambahkan baris-baris berikut untuk mengakses baik file maupun body. Penting untuk menggunakan nilai bidang `name` dari formulir dalam fungsi unggah Anda. Ini memberi tahu multer di mana di permintaan harus mencari file-file tersebut. Jika bidang-bidang ini tidak sama di dalam formulir HTML dan di server Anda, unggahan Anda akan gagal:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file adalah nama file Anda dalam formulir di atas, dalam hal ini 'uploaded_file'
  // req.body akan berisi bidang teks, jika ada 
  console.log(req.file, req.body)
});
```

## API

### Informasi File

Setiap file berisi informasi berikut:

Kunci | Deskripsi | Catatan
--- | --- | ---
`fieldname` | Nama bidang yang ditentukan dalam formulir |
`originalname` | Nama file di komputer pengguna |
`encoding` | Jenis encoding file |
`mimetype` | Jenis mime file |
`size` | Ukuran file dalam byte |
`destination` | Folder tempat file disimpan | `DiskStorage`
`filename` | Nama file dalam `destination` | `DiskStorage`
`path` | Jalur lengkap ke file yang diunggah | `DiskStorage`
`buffer` | `Buffer` dari seluruh file | `MemoryStorage`

### `multer(opts)`

Multer menerima objek opsi, yang paling dasar adalah properti `dest`, yang memberi tahu Multer tempat mengunggah file. Jika Anda tidak mencantumkan objek opsi, file akan tetap di dalam memori dan tidak pernah ditulis ke disk.

Secara default, Multer akan mengubah nama file agar menghindari konflik nama. Fungsi pengubahan nama dapat dises

uaikan sesuai kebutuhan Anda.

Berikut adalah opsi yang dapat diberikan kepada Multer.

Kunci | Deskripsi
--- | ---
`dest` atau `storage` | Tempat penyimpanan file
`fileFilter` | Fungsi untuk mengontrol file mana yang diterima
`limits` | Batasan data yang diunggah
`preservePath` | Menyimpan jalur lengkap file daripada hanya nama dasar

Dalam aplikasi web rata-rata, mungkin hanya `dest` yang diperlukan, dan dikonfigurasi seperti yang ditunjukkan dalam contoh berikut.

```javascript
const upload = multer({ dest: 'uploads/' })
```

Jika Anda ingin lebih banyak kendali atas unggahan Anda, Anda akan ingin menggunakan opsi `storage` daripada `dest`. Multer dilengkapi dengan mesin penyimpanan `DiskStorage` dan `MemoryStorage`; Mesin lain tersedia dari pihak ketiga.

#### `.single(fieldname)`

Terima satu file dengan nama `fieldname`. File tunggal akan disimpan
di dalam `req.file`.

#### `.array(fieldname[, maxCount])`

Terima array file, semuanya dengan nama `fieldname`. Jika diperlukan, berikan kesalahan jika lebih dari `maxCount` file diunggah. Array file akan disimpan dalam
`req.files`.

#### `.fields(fields)`

Terima campuran file, yang ditentukan oleh `fields`. Objek dengan array file
akan disimpan dalam `req.files`.

`fields` harus menjadi array objek dengan `name` dan secara opsional `maxCount`. Contoh:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Terima hanya bidang teks. Jika ada unggahan file, kesalahan dengan kode
"LIMIT_UNEXPECTED_FILE" akan dikeluarkan.

#### `.any()`

Terima semua file yang datang melalui jaringan. Array file akan disimpan dalam
`req.files`.

**PERINGATAN:** Pastikan Anda selalu menangani file yang diunggah oleh pengguna.
Jangan tambahkan multer sebagai middleware global karena pengguna jahat dapat mengunggah
file ke rute yang tidak Anda antisipasi. Gunakan fungsi ini hanya pada rute
di mana Anda menangani file yang diunggah.

### `storage`

#### `DiskStorage`

Mesin penyimpanan disk memberi Anda kendali penuh atas penyimpanan file ke disk.

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

Terdapat dua opsi yang tersedia, `destination` dan `filename`. Keduanya
merupakan fungsi yang menentukan di mana file harus disimpan.

`destination` digunakan untuk menentukan folder tempat file yang diunggah harus
disimpan. Ini juga dapat diberikan sebagai `string` (mis. `'/tmp/uploads'`). Jika tidak ada
`destination` yang diberikan, direktori default sistem operasi untuk file sementara
akan digunakan.

**Catatan:** Anda bertanggung jawab untuk membuat direktori saat menyediakan
`destination` sebagai fungsi. Ketika melewati string, multer akan memastikan
bahwa direktori dibuat untuk Anda.

`filename` digunakan untuk menentukan nama file dalam folder. Jika tidak ada
`filename` yang diberikan, setiap file akan diberi nama acak yang tidak
termasuk ekstensi file.

**Catatan:** Multer tidak akan menambahkan ekstensi file untuk Anda, fungsi Anda
harus mengembalikan nama file yang lengkap dengan ekstensi file.

Setiap fungsi menerima baik permintaan (`req`) maupun beberapa informasi tentang
file (`file`) untuk membantu dalam pengambilan keputusan.

Perhatikan bahwa `req.body` mungkin belum sepenuhnya diisi. Ini tergantung pada
urutan yang digunakan oleh klien untuk mengirimkan bidang dan file ke server.

Untuk memahami konvensi panggilan yang digunakan dalam panggilan balik (perlu melewatkan
null sebagai parameter pertama), lihat
[Penanganan Kesalahan Node.js](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Mesin penyimpanan memori menyimpan file sebagai objek `Buffer` di dalam memori. Ini
tidak memiliki opsi apa pun.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Ketika menggunakan penyimpanan memori, informasi file akan berisi bidang bernama
`buffer` yang berisi seluruh file.

**PERINGATAN**: Mengunggah file yang sangat besar atau file yang relatif kecil dalam jumlah besar dengan cepat, dapat membuat aplikasi Anda kehabisan memori ketika
penyimpanan memori digunakan.

### `limits`

Objek yang menentukan batasan ukuran dari properti opsional berikut. Multer meneruskan objek ini ke busboy secara langsung, dan detail properti dapat ditemukan di [halaman busboy](https://github.com/mscdex/busboy#busboy-methods).

Berikut adalah nilai integer yang tersedia:

Kunci | Deskripsi | Default
--- | --- | ---
`fieldNameSize` | Ukuran nama bidang maksimum | 100 byte
`fieldSize` | Ukuran nilai bidang maksimum (dalam byte) | 1MB
`fields` | Jumlah maksimum bidang non-file | Infinity
`fileSize` | Untuk formulir multipart, ukuran file maksimum (dalam byte) | Infinity
`files` | Untuk formulir multipart, jumlah maksimum bidang file | Infinity
`parts` | Untuk formulir multipart, jumlah maksimum bagian (bidang + file) | Infinity
`headerPairs` | Untuk formulir multipart, jumlah maksimum pasangan kunci=>nilai header yang akan diurai | 2000

Menentukan batasan dapat membantu melindungi situs Anda dari serangan layanan penolakan (DoS).

### `fileFilter`

Setel ini ke fungsi untuk mengontrol file mana yang harus diunggah dan mana yang harus dilewati. Fungsi harus terlihat seperti ini:

```javascript
function fileFilter (req, file, cb) {

  // Fungsi harus memanggil `

cb` dengan boolean
  // untuk menunjukkan apakah file harus diterima

  // Untuk menolak file ini, kirimkan `false`, seperti ini:
  cb(null, false)

  // Untuk menerima file, kirimkan `true`, seperti ini:
  cb(null, true)

  // Anda selalu bisa mengirimkan kesalahan jika terjadi sesuatu yang salah:
  cb(new Error('Saya tidak punya petunjuk!'))

}
```

## Penanganan Kesalahan

Ketika menghadapi kesalahan, Multer akan mendelegasikan kesalahan tersebut ke Express. Anda dapat menampilkan halaman kesalahan yang bagus dengan [cara ekspres standar](http://expressjs.com/guide/error-handling.html).

Jika Anda ingin menangkap kesalahan khusus dari Multer, Anda dapat memanggil
fungsi middleware tersebut sendiri. Selain itu, jika Anda hanya ingin menangkap [kesalahan Multer](https://github.com/expressjs/multer/blob/master/lib/multer-error.js), Anda dapat menggunakan kelas `MulterError` yang terpasang pada objek `multer` itu sendiri (mis. `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Kesalahan Multer terjadi saat mengunggah.
    } else if (err) {
      // Kesalahan yang tidak diketahui terjadi saat mengunggah.
    }

    // Semuanya berjalan dengan baik.
  })
})
```

## Mesin Penyimpanan Kustom

Untuk informasi tentang cara membuat mesin penyimpanan kustom, lihat [Mesin Penyimpanan Multer](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## Lisensi

[MIT](LICENSE)