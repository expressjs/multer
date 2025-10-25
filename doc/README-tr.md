# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer, `multipart/form-data` tipi formları işlemek için kullanılan bir Node.js middleware’idir ve genellikle dosya yükleme işlemlerinde kullanılır.
Maksimum verimlilik için [busboy](https://github.com/mscdex/busboy) üzerine yazılmıştır.

**NOT:** Multer, `multipart/form-data` olmayan formları işlemeyecektir.

## Çeviriler

Bu README dosyası ayrıca diğer dillerde de mevcuttur:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Arapça          |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Çince           |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | Fransızca       |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | Korece          |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Brezilya Portekizcesi |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Rusça           |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | İspanyolca      |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | Özbekçe         |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | Vietnamca       |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | Türkçe          |

## Kurulum

```sh
$ npm install multer
```

## Kullanım

Multer, `request` nesnesine bir `body` nesnesi ve bir `file` veya `files` nesnesi ekler. `body` nesnesi formdaki metin alanlarının değerlerini içerir; `file` veya `files` nesnesi ise form aracılığıyla yüklenen dosyaları içerir.

Temel kullanım örneği:

Formunuzda enctype="multipart/form-data" eklemeyi unutmayın.

```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" />
</form>
```

```javascript
const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const app = express();

app.post("/profile", upload.single("avatar"), function (req, res, next) {
   // req.file `avatar` dosyasıdır
  // req.body varsa formdaki metin alanlarını tutar
});

app.post(
  "/photos/upload",
  upload.array("photos", 12),
  function (req, res, next) {
     // req.files `photos` dosyalarının dizisidir
    // req.body varsa metin alanlarını içerir
  }
);

const uploadMiddleware = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "gallery", maxCount: 8 },
]);
app.post("/cool-profile", uploadMiddleware, function (req, res, next) {
  
// req.files bir nesnedir (String -> Array) ve burada fieldname (alan adı) anahtar, değer ise dosyaların bulunduğu bir dizidir.
// Örneğin:
// req.files['avatar'][0] -> File
// req.files['gallery'] -> Array
//
// req.body varsa metin alanların içerir

});
```

Sadece metin verilerini içeren bir multipart formu işlemek için .none() metodunu kullanabilirsiniz:

```javascript
const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer();

app.post("/profile", upload.none(), function (req, res, next) {
 // req.body metin alanlarını içerir
});
```

İşte multer'ın HTML formunda nasıl kullanıldığına dair bir örnek. `Enctype="multipart/form-data"` ve `name="uploaded_file"` alanlarına özellikle dikkat edin:





```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file" />
    <input
      type="text"
      class="form-control"
      placeholder="Number of speakers"
      name="nspeakers"
    />
    <input type="submit" value="Get me the stats!" class="btn btn-default" />
  </div>
</form>
```

Ardından JavaScript dosyanızda, hem dosyaya hem de body’ye erişmek için bu satırları eklemeniz gerekir. Upload fonksiyonunuzda formdaki `name` alanı değerini kullanmanız önemlidir. Bu, multer’a request içindeki hangi alanda dosya araması gerektiğini söyler. Eğer bu alanlar HTML formunda ve sunucuda aynı değilse, yükleme başarısız olur.





```javascript
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
app.post("/stats", upload.single("uploaded_file"), function (req, res) {
   // req.file formdaki dosya, burada 'uploaded_file'
  // req.body metin alanlarını içerir
  console.log(req.file, req.body);
});
```

## API

### Dosya bilgisi

Her dosya aşağıdaki bilgileri içerir:

| Anahtar        | Açıklama                                | Not             |
| -------------- | -------------------------------------- | --------------- |
| `fieldname`    | Formdaki alan adı                        |                 |
| `originalname` | Kullanıcının bilgisayarındaki dosya adı  |                 |
| `encoding`     | Dosyanın kodlama tipi                    |                 |
| `mimetype`     | Dosyanın MIME tipi                        |                 |
| `size`         | Dosyanın boyutu (byte)                   |                 |
| `destination`  | Dosyanın 'destination' içindeki adı       | `DiskStorage`   |
| `filename`     | Dosyanın klasör içindeki adı             | `DiskStorage`   |
| `path`         | Yüklenen dosyanın tam yolu               | `DiskStorage`   |
| `buffer`       | Dosyanın tamamını içeren `Buffer`       | `MemoryStorage` |

### `multer(opts)`

Multer bir options (ayarlar) nesnesi kabul eder. En temel seçenek `dest` olup, dosyaların nereye yükleneceğini belirtir. Eğer options nesnesi verilmezse dosyalar bellekte tutulur ve diske yazılmaz.

Varsayılan olarak, ad çakışmalarını önlemek için Multer dosyaları yeniden adlandırır. Yeniden adlandırma fonksiyonu ihtiyacınıza göre özelleştirilebilir.

Multer’a geçirilebilecek seçenekler:


| Anahtar           | Açıklama                                                |
| ----------------- | ------------------------------------------------------ |
| `dest` veya `storage` | Dosyaların nereye kaydedileceği                       |
| `fileFilter`      | Hangi dosyaların kabul edileceğini kontrol eden fonksiyon |
| `limits`          | Yüklenen veri sınırları                                 |
| `preservePath`    | Sadece dosya adı yerine tam yolu saklar                |


Ortalama bir web uygulamasında genellikle sadece `dest` gerekir:

```javascript
const upload = multer({ dest: "uploads/" });
```

Daha fazla kontrol için `storage` seçeneğini kullanabilirsiniz. `Multer`, `DiskStorage` ve `MemoryStorage` depolama motorları ile gelir; üçüncü taraf motorlar da mevcuttur.

#### `.single(fieldname)`

Tek bir dosya kabul eder ve `fieldname` ile eşleşen dosyayı `req.file` içine koyar.

#### `.array(fieldname[, maxCount])`

Birden fazla dosya kabul eder ve `fieldname` ile eşleşenleri `req.files` dizisine koyar. Opsiyonel olarak `maxCount`'tan fazla dosya yüklenirse hata verir.

#### `.fields(fields)`

Belirtilen alanlardan dosya kabul eder. fields bir nesne dizisi olup `req.files` içine koyulur.

`fields`, `name` ve isteğe bağlı olarak `maxCount` içeren nesnelerden oluşan bir dizi olmalıdır.
Örnek:

```javascript
[
  { name: "avatar", maxCount: 1 },
  { name: "gallery", maxCount: 8 },
];
```

#### `.none()`

Yalnızca metin alanlarını kabul eder. Herhangi bir dosya yüklenirse,
“LIMIT_UNEXPECTED_FILE” kodlu bir hata verir

#### `.any()`

Ağ üzerinden gelen tüm dosyaları kabul eder. Bir dizi dosya
`req.files` içinde saklanacaktır.

**UYARI:** Kullanıcıların yüklediği dosyaları her zaman kendiniz işlediğinizden emin olun.
Kötü niyetli bir kullanıcı, sizin öngörmediğiniz bir rotaya dosya yükleyebileceğinden, multer'ı asla global bir orta katman yazılımı olarak eklemeyin.
Bu işlevi yalnızca, yüklenen dosyaları işlediğiniz rotalarda kullanın.
**ÖNERİ:** Multer'ı bir orta katman yazılımı olarak kullanmak yerine, dosya yüklemeyi işleyen bir orta katman yazılımı kullanın.

### `storage`

#### `DiskStorage`

Disk depolama motoru, dosyaları diske kaydetme konusunda size tam kontrol sağlar.

```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp/my-uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });
```

İki seçenek mevcuttur: `destination` ve `filename`. Her ikisi de
dosyanın nerede saklanacağını belirleyen işlevlerdir.

`destination`, yüklenen dosyaların hangi klasörde
saklanacağını belirlemek için kullanılır. Bu, `string` olarak da verilebilir (ör. `'/tmp/uploads'`). Eğer
`destination` verilmezse, işletim sisteminin geçici dosyalar için varsayılan
dizini kullanılır.

**Not:** `destination` işlevini kullanarak dizin oluşturmaktan siz
sorumlusunuz. Bir string aktardığınızda, multer dizin sizin için
oluşturulduğundan emin olacaktır.

`filename`, dosyanın klasör içinde nasıl adlandırılacağını belirlemek için kullanılır.
`filename` belirtilmezse, her dosyaya dosya uzantısı içermeyen rastgele bir ad verilir.

**Not:** Multer sizin için herhangi bir dosya uzantısı eklemez, işleviniz
dosya uzantısı ile birlikte tam bir dosya adı döndürmelidir.

Her fonksiyona, karar vermeyi kolaylaştırmak için hem istek (`req`) hem de dosya
hakkında bazı bilgiler (`file`) aktarılır.

`req.body`'nin henüz tam olarak doldurulmamış olabileceğini unutmayın. Bu,
istemcinin alanları ve dosyaları sunucuya aktarma sırasına bağlıdır.

Geri aramada kullanılan çağırma kuralını anlamak için (ilk parametre olarak null geçilmesi gerekir),
[Node.js hata işleme](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Bellek depolama motoru, dosyaları bellekte `Buffer` nesneleri olarak depolar.
Herhangi bir seçeneği yoktur.

```javascript
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
```

Bellek depolama kullanıldığında, dosya bilgileri tüm dosyayı içeren
`buffer` adlı bir alan içerir.

**UYARI**: Çok büyük dosyaları veya nispeten küçük dosyaları çok hızlı bir şekilde
çok sayıda yüklemek, bellek depolama kullanıldığında uygulamanızın bellek yetersizliği
sorununa neden olabilir.

### `limits`

Aşağıdaki isteğe bağlı özelliklerin boyut sınırlarını belirten bir nesne. Multer bu nesneyi doğrudan busboy'a aktarır ve özelliklerin ayrıntıları [busboy'un sayfasında](https://github.com/mscdex/busboy#busboy-methods) bulunabilir.

Kullanılabilir tamsayı değerleri şöyledir:

| Anahtar          | Açıklama                                                                 | Varsayılan  |
| ---------------- | ------------------------------------------------------------------------ | ------------ |
| `fieldNameSize`  | Maksimum alan adı boyutu                                                 | 100 bayt     |
| `fieldSize`      | Maksimum alan değeri boyutu (byte cinsinden)                             | 1MB          |
| `fields`         | Dosya olmayan alanların maksimum sayısı                                  | Sonsuz       |
| `fileSize`       | Çok parçalı (multipart) formlar için maksimum dosya boyutu (bayt cinsinden) | Sonsuz       |
| `files`          | Çok parçalı (multipart) formlar için maksimum dosya alanı sayısı         | Sonsuz       |
| `parts`          | Çok parçalı (multipart) formlar için toplam parça sayısı (alan + dosya)  | Sonsuz       |
| `headerPairs`    | Çok parçalı (multipart) formlar için ayrıştırılacak maksimum header anahtar-değer çifti sayısı | 2000          |


Sınırları belirlemek, sitenizi hizmet reddi (DoS) saldırılarına karşı korumaya yardımcı olabilir.

### `fileFilter`

Yüklenecek ve atlanacak dosyaları kontrol etmek için bunu bir işleve ayarlayın.
İşlev şu şekilde olmalıdır:

```javascript
function fileFilter(req, file, cb) {
  // Fonksiyon, dosyanın kabul edilip edilmeyeceğini belirtmek için
  // boolean bir değerle `cb` fonksiyonunu çağırmalıdır.

  // Bu dosyayı reddetmek için false döndürün:
  cb(null, false);

  // Dosyayı kabul etmek için true döndürün:
  cb(null, true);

  // Bir hata oluşursa her zaman bir hata da döndürebilirsiniz:
  cb(new Error("Ne olduğunu bilmiyorum!"));
}
```

## Hata Yönetimi 

Bir hatayla karşılaşıldığında, Multer hatayı Express'e devreder.
[Standart Express yöntemi](http://expressjs.com/guide/error-handling.html) kullanarak güzel bir hata sayfası görüntüleyebilirsiniz.

Özellikle Multer'dan gelen hataları yakalamak istiyorsanız,
orta katman işlevini kendiniz çağırabilirsiniz. Ayrıca, yalnızca [Multer hatalarını](https://github.com/expressjs/multer/blob/main/lib/multer-error.js) yakalamak istiyorsanız, `multer` nesnesine eklenmiş olan `MulterError` sınıfını kullanabilirsiniz (ör. `err instanceof multer.MulterError`).

```javascript
const multer = require("multer");
const upload = multer().single("avatar");

app.post("/profile", function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Yükleme sırasında bir Multer hatası oluştu
    } else if (err) {
      // Yükleme sırasında bilinmeyen bir hata oluştu
    }

    // Her şey sorunsuz geçti.
  });
});
```

## Özel depolama motoru

Kendi depolama motorunuzu nasıl oluşturacağınız hakkında bilgi için [Multer Depolama Motoru](https://github.com/expressjs/multer/blob/main/StorageEngine.md) bölümüne bakın.

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
