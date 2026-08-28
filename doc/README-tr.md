# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer, öncelikle dosya yüklemek için kullanılan `multipart/form-data` verilerini işleyen bir node.js middleware'idir. Maksimum verimlilik için
[busboy](https://github.com/mscdex/busboy) üzerine yazılmıştır.

**NOT**: Multer, multipart olmayan (`multipart/form-data`) hiçbir formu işlemez.

## Çeviriler

Bu README başka dillerde de mevcuttur:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | İngilizce       |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Arapça          |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Çince (Basitleştirilmiş) |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | Fransızca       |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | Japonca         |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | Endonezce   |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | Korece          |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Portekizce (BR) |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Rusça           |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | İspanyolca      |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | Tamilce         |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | Özbekçe         |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | Vietnamca       |


## Kurulum

```sh
$ npm install multer
```

## Kullanım

Multer, `request` nesnesine bir `body` nesnesi ile bir `file` veya `files` nesnesi ekler. `body` nesnesi formdaki metin alanlarının değerlerini, `file` veya `files` nesnesi ise form aracılığıyla yüklenen dosyaları içerir.

Temel kullanım örneği:

Formunuzda `enctype="multipart/form-data"` özniteliğini eklemeyi unutmayın.

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
  // req.file, `avatar` dosyasıdır
  // req.body, varsa metin alanlarını tutar
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files, `photos` dosyalarının dizisidir
  // req.body, varsa metin alanlarını içerir
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files, anahtarı fieldname olan ve değeri dosya dizisi olan bir nesnedir (String -> Array)
  //
  // ör.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body, varsa metin alanlarını içerir
})
```

Yalnızca metin içeren bir multipart formu işlemeniz gerekiyorsa `.none()` metodunu kullanmalısınız:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body metin alanlarını içerir
})
```

Multer'ın bir HTML formunda nasıl kullanıldığına dair bir örnek aşağıdadır. `enctype="multipart/form-data"` ve `name="uploaded_file"` alanlarına özellikle dikkat edin:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Ardından, hem dosyaya hem de body'ye erişmek için JavaScript dosyanıza şu satırları eklersiniz. Yükleme fonksiyonunuzda formdaki `name` alanının değerini kullanmanız önemlidir. Bu, Multer'a dosyaları isteğin hangi alanında araması gerektiğini söyler. Bu alanlar HTML formunda ve sunucunuzda aynı değilse yükleme başarısız olur:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file, yukarıdaki formdaki dosyanızın adıdır; burada 'uploaded_file'
  // req.body, varsa metin alanlarını tutar
  console.log(req.file, req.body)
});
```



## API

### Dosya bilgileri

Her dosya aşağıdaki bilgileri içerir:

Anahtar | Açıklama | Not
--- | --- | ---
`fieldname` | Formda belirtilen alan adı |
`originalname` | Dosyanın kullanıcının bilgisayarındaki adı veya `preservePath: true` olduğunda tam yolu |
`encoding` | Dosyanın kodlama türü |
`mimetype` | Dosyanın MIME türü |
`size` | Dosyanın bayt cinsinden boyutu |
`destination` | Dosyanın kaydedildiği klasör | `DiskStorage`
`filename` | Dosyanın `destination` içindeki adı | `DiskStorage`
`path` | Yüklenen dosyanın tam yolu | `DiskStorage`
`buffer` | Dosyanın tamamını içeren bir `Buffer` | `MemoryStorage`

### `multer(opts)`

Multer bir seçenekler nesnesi kabul eder; bunların en temeli, Multer'a dosyaları
nereye yükleyeceğini söyleyen `dest` özelliğidir. Seçenekler nesnesini
vermezseniz dosyalar bellekte tutulur ve asla diske yazılmaz.

Varsayılan olarak Multer, ad çakışmalarını önlemek için dosyaları yeniden adlandırır.
Yeniden adlandırma fonksiyonu ihtiyaçlarınıza göre özelleştirilebilir.

Multer'a aktarılabilecek seçenekler şunlardır.

Anahtar | Açıklama
--- | ---
`dest` veya `storage` | Dosyaların nerede saklanacağı
`fileFilter` | Hangi dosyaların kabul edileceğini denetleyen fonksiyon
`limits` | Yüklenen verinin sınırları
`preservePath` | `file.originalname` içinde yalnızca temel adı değil, istemcinin sağladığı tam yolu tutar
`defParamCharset` | Genişletilmiş parametre olmayan (açık bir charset içermeyen) bölüm başlığı parametrelerinin değerleri (ör. filename) için kullanılacak varsayılan karakter kümesi. Varsayılan: `'latin1'`

Ortalama bir web uygulamasında yalnızca `dest` gerekli olabilir ve aşağıdaki
örnekte gösterildiği gibi yapılandırılır.

```javascript
const upload = multer({ dest: 'uploads/' })
```

`preservePath` etkinleştirildiğinde Multer, gelen dosya adını istemcinin sağladığı
yol bölümleriyle birlikte olduğu gibi aktarır. Bu değer `file.originalname` olarak
sunulur; hedef klasörü değiştirmez, dizin oluşturmaz ve yolu sizin için
temizlemez. `file.originalname` her zaman istemci tarafından sağlanır ve güvenilmez
olarak ele alınmalıdır; `preservePath` ile birlikte ayrıca istemcinin gönderdiği yol
bölümlerini de içerir. Özel bir `filename` veya depolama motorunda kullanmadan önce
bu değeri normalleştirin ya da doğrulayın.

Yüklemeleriniz üzerinde daha fazla denetim istiyorsanız `dest` yerine `storage`
seçeneğini kullanmak isteyeceksiniz. Multer, `DiskStorage` ve `MemoryStorage`
depolama motorlarıyla birlikte gelir; üçüncü taraflarca sunulan başka motorlar da mevcuttur.

#### `.single(fieldname)`

`fieldname` adında tek bir dosya kabul eder. Bu tek dosya `req.file` içinde
saklanır.

#### `.array(fieldname[, maxCount])`

Tümü `fieldname` adında olan bir dosya dizisi kabul eder. İsteğe bağlı olarak,
`maxCount` değerinden fazla dosya yüklenirse hata verir. Dosya dizisi
`req.files` içinde saklanır.

#### `.fields(fields)`

`fields` ile belirtilen karma bir dosya kümesi kabul eder. Dosya dizileri içeren
bir nesne `req.files` içinde saklanır.

`fields`, `name` ve isteğe bağlı olarak `maxCount` içeren nesnelerden oluşan bir dizi olmalıdır.
Örnek:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Yalnızca metin alanlarını kabul eder. Herhangi bir dosya yüklenirse
"LIMIT\_UNEXPECTED\_FILE" kodlu bir hata üretilir.

#### `.any()`

Ağ üzerinden gelen tüm dosyaları kabul eder. Dosya dizisi `req.files` içinde
saklanır.

**UYARI:** Kullanıcının yüklediği dosyaları her zaman işlediğinizden emin olun.
Kötü niyetli bir kullanıcı öngörmediğiniz bir rotaya dosya yükleyebileceğinden,
Multer'ı asla global bir middleware olarak eklemeyin. Bu fonksiyonu yalnızca
yüklenen dosyaları işlediğiniz rotalarda kullanın.

### `storage`

#### `DiskStorage`

Disk depolama motoru, dosyaların diske kaydedilmesi üzerinde size tam denetim sağlar.

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

İki seçenek mevcuttur: `destination` ve `filename`. Her ikisi de dosyanın
nerede saklanacağını belirleyen fonksiyonlardır.

`destination`, yüklenen dosyaların hangi klasörde saklanacağını belirlemek için
kullanılır. Bu değer `string` olarak da verilebilir (ör. `'/tmp/uploads'`).
`destination` verilmezse, işletim sisteminin geçici dosyalar için varsayılan
dizini kullanılır.

**Not:** `destination` değerini fonksiyon olarak verdiğinizde dizini oluşturmak
sizin sorumluluğunuzdadır. Bir string aktardığınızda ise Multer dizinin sizin
için oluşturulmasını sağlar.

`filename`, dosyanın klasör içinde hangi adı alacağını belirlemek için kullanılır.
`filename` verilmezse, her dosyaya dosya uzantısı içermeyen rastgele bir ad
verilir.

**Not:** Multer sizin için hiçbir dosya uzantısı eklemez; fonksiyonunuz dosya
uzantısıyla birlikte eksiksiz bir dosya adı döndürmelidir.

Karar vermeye yardımcı olması için her fonksiyona hem istek (`req`) hem de dosya
hakkında bazı bilgiler (`file`) aktarılır.

`req.body` nesnesinin henüz tamamen doldurulmamış olabileceğini unutmayın. Bu,
istemcinin alanları ve dosyaları sunucuya gönderme sırasına bağlıdır.

Geri çağırmada kullanılan çağrı kuralını (ilk parametre olarak null geçirilmesi
gerektiğini) anlamak için
[Node.js hata işleme](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors) sayfasına bakın.

#### `MemoryStorage`

Bellek depolama motoru, dosyaları bellekte `Buffer` nesneleri olarak saklar.
Herhangi bir seçeneği yoktur.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Bellek depolama kullanıldığında, dosya bilgileri dosyanın tamamını içeren
`buffer` adlı bir alan içerir.

**UYARI**: Bellek depolama kullanıldığında çok büyük dosyaların veya nispeten küçük
dosyaların çok sayıda ve çok hızlı yüklenmesi, uygulamanızın belleğinin
tükenmesine yol açabilir.

### `limits`

Aşağıdaki isteğe bağlı özelliklerin boyut sınırlarını belirten bir nesne. Multer bu nesneyi doğrudan busboy'a aktarır; özelliklerin ayrıntıları [busboy'un sayfasında](https://github.com/mscdex/busboy#exports) bulunabilir.

Aşağıdaki tamsayı değerleri kullanılabilir:

Anahtar | Açıklama | Varsayılan
--- | --- | ---
`fieldNameSize` | Maksimum alan adı boyutu | Infinity
`fieldSize` | Maksimum alan değeri boyutu (bayt cinsinden) | 1MB
`fields` | Dosya olmayan alanların maksimum sayısı | Infinity
`fileSize` | Multipart formlar için maksimum dosya boyutu (bayt cinsinden) | Infinity
`files` | Multipart formlar için maksimum dosya alanı sayısı | Infinity
`parts` | Multipart formlar için maksimum bölüm sayısı (alanlar + dosyalar) | Infinity
`headerPairs` | Multipart formlar için ayrıştırılacak maksimum başlık anahtar=>değer çifti sayısı | 2000
`fieldNestingDepth` | Alan adları için maksimum iç içe geçme düzeyi sayısı (ör. `a[b][c]` 2 düzeye sahiptir) | Infinity
`fieldArrayIndexLimit` | Bir alan adı içinde kabul edilen maksimum sayısal dizi indeksi (ör. `a[3]` 3 indeksini kullanır) | Infinity

`parts` sınırı, busboy yapılandırılan bölüm sayısına ulaştığında tetiklenir;
yalnızca bu sayı aşıldıktan sonra değil. Tam olarak belirli bir sayıda alan ve
dosyaya izin vermek istiyorsanız `parts` değerini bu toplamdan en az bir fazla olacak şekilde ayarlayın.

Sınırları belirlemek, sitenizi hizmet reddi (DoS) saldırılarına karşı korumaya yardımcı olabilir.

### `fileFilter`

Hangi dosyaların yükleneceğini ve hangilerinin atlanacağını denetlemek için bunu
bir fonksiyon olarak ayarlayın. Fonksiyon şu şekilde olmalıdır:

```javascript
function fileFilter (req, file, cb) {

  // Fonksiyon, dosyanın kabul edilip edilmeyeceğini belirtmek için
  // `cb` fonksiyonunu bir boolean değerle çağırmalıdır

  // Bu dosyayı reddetmek için `false` geçirin, şu şekilde:
  cb(null, false)

  // Dosyayı kabul etmek için `true` geçirin, şu şekilde:
  cb(null, true)

  // Bir şeyler ters giderse her zaman bir hata geçirebilirsiniz:
  cb(new Error('I don\'t have a clue!'))

}
```

## Güvenlik

[Sınırları](#limits) belirlemek, sitenizi hizmet reddi (DoS) saldırılarına karşı korumaya yardımcı olabilir. Çoğu uygulama için aşağıdaki sınırlar önerilir:

- `fileSize` -- kullanım senaryonuzda beklenen maksimum dosya boyutuna ayarlayın
- `files` -- istek başına maksimum dosya sayısına ayarlayın
- `fields` -- istek başına maksimum metin alanı sayısına ayarlayın
- `fieldNestingDepth` -- alan adlarınızın gerektirdiği minimum derinliğe ayarlayın (ör. `a[b][c]` için `3`)
- `fieldArrayIndexLimit` -- alan adlarınızın gerektirdiği en büyük dizi indeksine ayarlayın (ör. `a[99]` için `100`)

## Hata işleme

Bir hatayla karşılaşıldığında Multer hatayı Express'e devreder.
[Standart Express yöntemini](https://expressjs.com/en/guide/error-handling/) kullanarak güzel bir hata sayfası gösterebilirsiniz.

Hataları özellikle Multer'dan yakalamak istiyorsanız middleware fonksiyonunu
kendiniz çağırabilirsiniz. Ayrıca yalnızca [Multer hatalarını](https://github.com/expressjs/multer/blob/main/lib/multer-error.js) yakalamak istiyorsanız, `multer` nesnesinin kendisine eklenmiş olan `MulterError` sınıfını kullanabilirsiniz (ör. `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Yükleme sırasında bir Multer hatası oluştu.
    } else if (err) {
      // Yükleme sırasında bilinmeyen bir hata oluştu.
    }

    // Her şey yolunda gitti.
  })
})
```

## Özel depolama motoru

Kendi depolama motorunuzu nasıl oluşturacağınız hakkında bilgi için [Multer Depolama Motoru](https://github.com/expressjs/multer/blob/main/StorageEngine.md) sayfasına bakın.

## Lisans

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
