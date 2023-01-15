# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer, öncelikli işlevi dosya yüklemek olan `multipart/form-data`yı işlemek için bir node.js ara yazılımıdır. Azami verimlilik için [busboy](https://github.com/mscdex/busboy) üzerinde yazılmıştır.

**DİKKAT**: Multer, çok parçalı olmayan hiçbir (`multipart/form-data`) formu işlemeyecektir.

## Çeviriler

Bu BENİOKU dosyası diğer dillerde de mevcuttur:

- [Engilsh](https://github.com/expressjs/multer/blob/master/README.md) (İngilizce, asıl metin)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (İspanyolca)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (Çince)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (Korece)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (Rusça)
- [Việt Nam](https://github.com/expressjs/multer/blob/master/doc/README-vi.md) (Vietnamca)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (Brezilya Portekizcesi)

## Kurulum

```sh
$ npm install --save multer
```

## Kullanım

Multer, `request` (object)nesnesine bir `body` nesnesi ve bir `file` veya `files` nesnesi ekler. `body` nesnesi, formun metin alanlarının değerlerini içerir, "file" veya "files" nesnesi, form aracılığıyla yüklenen dosyaları içerir.

Temel kullanım örneği:

Formunuzdaki `enctype="multipart/form-data"`'yı unutmayın.

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
	// req.file 'avatar' dosyasıdır
	// req.body, eğer varsa metin alanlarını tutacaktır
});

app.post(
	"/photos/upload",
	upload.array("photos", 12),
	function (req, res, next) {
		// req.files, "photos" dosyalarının dizisidir
		// req.body, eğer varsa metin alanlarını içerecektir
	}
);

const cpUpload = upload.fields([
	{ name: "avatar", maxCount: 1 },
	{ name: "gallery", maxCount: 8 },
]);
app.post("/cool-profile", cpUpload, function (req, res, next) {
	// req.files, alan adının anahtar olduğu ve değerin dosya dizisi olduğu(String -> Array) bir (object)nesnedir .
	//
	// Örneğin:
	// req.files['avatar'][0] -> Dosya
	// req.files['gallery'] -> Dizi
	//
	// req.body, varsa metin alanlarını içerecektir
});
```

Salt metinden oluşan çok parçalı bir formu işlemeniz gerekirse, `.none()` (methodunu)yöntemini kullanmalısınız:

```javascript
const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer();

app.post("/profile", upload.none(), function (req, res, next) {
	// req.body metin alanlarını içerir
});
```

İşte bir HTML formunun multer'ın nasıl kullanıldığına dair bir örnek. `enctype="multipart/form-data"` ve `name="uploaded_file"` alanlarına özellikle dikkat edin:

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

Then in your javascript file you would add these lines to access both the file and the body. It is important that you use the `name` field value from the form in your upload function. This tells multer which field on the request it should look for the files in. If these fields aren't the same in the HTML form and on your server, your upload will fail:

Ardından javascript dosyanıza hem dosyaya hem de gövdeye(body'e) erişmek için bu satırları eklersiniz. Yükleme işlevinizde(fonksiyonunuzdaki) formdaki `name` alan değerini kullanmanız önemlidir. Bu, multer'a istekte hangi alanda dosyalara araması gerektiğini söyler. Bu alanlar HTML formunda ve sunucunuzda aynı değilse, yüklemeniz başarısız olur:

```javascript
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
app.post("/stats", upload.single("uploaded_file"), function (req, res) {
	// req.file, yukarıdaki formdaki dosyanızın adıdır, burada 'uploaded_file'
	// req.body, eğer varsa metin alanlarını tutacaktır
	console.log(req.file, req.body);
});
```

## API

### Dosya bilgisi

Her dosya aşağıdaki bilgileri içerir:

| Key(anahtar)   | Açıklama                                   | Not             |
| -------------- | ------------------------------------------ | --------------- |
| `fieldname`    | Formda belirtilen alan adı                 |
| `originalname` | Kullanıcının bilgisayarındaki dosyanın adı |
| `encoding`     | Dosyanın kodlama türü                      |
| `mimetype`     | Dosyanın mime türü                         |
| `size`         | Dosyanın bayt cinsinden boyutu             |
| `destination`  | Dosyanın kaydedildiği klasör               | `DiskStorage`   |
| `filename`     | `destination` içindeki dosyanın adı        | `DiskStorage`   |
| `path`         | Yüklenen dosyanın tam yolu                 | `DiskStorage`   |
| `buffer`       | Tüm dosyanın bir `Buffer`'ı (arabelleği)   | `MemoryStorage` |

### `multer(opts)`

Multer, en temel özelliği Multer'a dosyaları nereye yükleyeceğini söyleyen özelliği olan `dest` (property)niteliğini kabul eder.seçenekler nesnesini(options object) kabul eder. Seçenekler nesnesini atlarsanız, dosyalar bellekte tutulur ve asla diske yazılmaz.

Multer, adlandırma çakışmalarını önlemek için dosyaları varsayılan olarak yeniden adlandırır. Yeniden adlandırma işlevi ihtiyaçlarınıza göre özelleştirilebilir.

Aşağıdakiler Multer'a verilebilecek seçeneklerdir.

| Key(anahtar)          | Açıklama                                               |
| --------------------- | ------------------------------------------------------ |
| `dest` veya `storage` | Dosyaların nerede saklanacağı                          |
| `fileFilter`          | Hangi dosyaların kabul edildiğini kontrol etme işlevi  |
| `limits`              | Yüklenen verilerin sınırları                           |
| `preservePath`        | Yalnızca temel ad yerine dosyaların tam yolunu saklama |

Ortalama bir web uygulamasında yalnızca `dest` gerekli olabilir ve aşağıdaki örnekte gösterildiği gibi yapılandırılabilir.

```javascript
const upload = multer({ dest: "uploads/" });
```

Yüklemeleriniz üzerinde daha fazla kontrol istiyorsanız, `dest` yerine `storage` seçeneğini kullanmak isteyeceksinizdir. Multer, `DiskStorage` ve `MemoryStorage` depolama motorlarıyla birlikte gelir; Üçüncü şahıslardan da kullanılabilecek fazlaca motorlar mevcuttur.

#### `.single(fieldname)`

`fieldname` adlı tek bir dosyayı kabul edin. Tek dosya `req.file`' içinde saklanacaktır.

#### `.array(fieldname[, maxCount])`

Hepsi `fieldname` adında olacak şekilde bir dizi dosyayı kabul edin. İsteğe bağlı olarak, `maxCount`'tan fazla dosya yüklendiğinde hata verir. Dosya dizisi `req.files` içinde saklanacaktır.

#### `.fields(fields)`

`fields` tarafından belirtilen bir dosya karışımını kabul edin. Dosya dizileri olan bir nesne `req.files` içinde saklanacaktır.

`fields`, `name` ve isteğe bağlı olarak `maxCount` içeren bir nesne dizisi olmalıdır.
Örnek:

```javascript
[
	{ name: "avatar", maxCount: 1 },
	{ name: "gallery", maxCount: 8 },
];
```

#### `.none()`

Yalnızca metin alanlarını kabul edin. Herhangi bir dosya yüklemesi yapılırsa
"LIMIT_UNEXPECTED_FILE" hatası alınacaktır.

#### `.any()`

Tel üzerinden gelen tüm dosyaları kabul eder. Dosyaların dizisi `req.files` içinde saklanacaktır.

**WARNING:** Make sure that you always handle the files that a user uploads.
Never add multer as a global middleware since a malicious user could upload
files to a route that you didn't anticipate. Only use this function on routes where you are handling the uploaded files.

**UYARI:** Bir kullanıcının yüklediği dosyalarla her zaman işlediğinizden ve ilgilendiğinizden emin olun. Kötü niyetli bir kullanıcı karşıya dosya yükleyebileceğinden, multer'ı asla küresel bir ara katman(middleware) yazılımı olarak eklemeyin dosyaları tahmin etmediğiniz bir rotaya yönlendirin. Bu işlevi yalnızca karşıya yüklenen dosyaları işlediğiniz rotalarda kullanın.

### `storage`

#### `DiskStorage`

Disk depolama motoru, dosyaları diske depolama konusunda size tam kontrol sağlar.

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

Kullanılabilir iki seçenek vardır, `destination` ve `filename`. Her ikisi de dosyanın nerede saklanması gerektiğini belirleyen işlevlerdir.

`destination`, yüklenen dosyaların hangi klasörde saklanacağını belirlemek için kullanılır. Bu aynı zamanda bir `string` olarak da verilebilir (örneğin `'/tmp/uploads'`). `destination` verilmezse, işletim sisteminin geçici dosyalar için varsayılan dizini kullanılır.

**Not:** Bir işlev(fonksiyon) olarak `destination` kullanırken dizini oluşturmaktan siz sorumlusunuz. Bir string verirseniz multer, dizinin sizin için oluşturulduğundan emin olacaktır.

`filename`, dosyanın klasör içinde ne olarak adlandırılacağını belirlemek için kullanılır. Dosya adı verilmezse, her dosyaya herhangi bir dosya uzantısı içermeyen rastgele bir ad verilir.

**Not:** Multer sizin için herhangi bir dosya uzantısı eklemeyecektir, işleviniz dosya uzantısıyla birlikte eksiksiz bir dosya adı döndürmelidir.

Her işlev, karara yardımcı olmak için hem (request'ten)istekten (`req`) hem de dosya (`file`) hakkında bazı bilgilerden geçer.

`req.body`'nin henüz tam olarak doldurulmamış olabileceğini unutmayın. İstemcinin alanları ve dosyaları sunucuya iletme sırasına bağlıdır.

Geri aramada kullanılan arama kuralını(calling convention) anlamak için (ilk parametre olarak null değerinin verilmesi gerekir), bkz.
[Node.js hata işleme](https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Bellek depolama motoru, dosyaları `Buffer` nesneleri olarak bellekte saklar. Herhangi bir seçeneği yok.

```javascript
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
```

Bellek depolamayı kullanırken, dosya bilgisi, tüm dosyayı içeren `buffer`(arabellek) adlı bir alan içerecektir.

**UYARI**: Çok büyük dosyaların veya çok sayıdaki nispeten küçük dosyaların çok hızlı bir şekilde yüklenmesi, bellek depolaması kullanıldığında uygulamanızın belleğinin dolmasına neden olabilir.

### `limits`

Aşağıdaki isteğe bağlı özelliklerin boyut sınırlarını belirten bir nesne. Multer bu nesneyi doğrudan busboy'a iletir ve özelliklerin ayrıntıları [busboy'un kendi sayfası](https://github.com/mscdex/busboy#busboy-methods)nda bulunabilir.

Aşağıdaki integer değerleri mevcuttur:

| Key(anahtar)    | Açıklama                                                                                                | Varsayılan  |
| --------------- | ------------------------------------------------------------------------------------------------------- | ----------- |
| `fieldNameSize` | Azami alan adı boyutu                                                                                   | 100 bytelar |
| `fieldSize`     | Azami alan değeri boyutu (bayt olarak)                                                                  | 1MB         |
| `fields`        | Azami dosya dışı alan sayısı                                                                            | Infinity    |
| `fileSize`      | Çok parçalı formlar(multipart forms) için maksimum dosya boyutu (bayt olarak)                           | Infinity    |
| `files`         | Çok parçalı formlar(multipart forms) için azami dosya alanı sayısı                                      | Infinity    |
| `parts`         | Çok parçalı formlar(multipart forms) için maksimum parça sayısı (alanlar(fields) + dosyalar(files))     | Infinity    |
| `headerPairs`   | Çok parçalı formlar(multipart forms), ayrıştırılacak başlık anahtarı=>değer çiftlerinin maksimum sayısı | 2000        |

Sınırları belirlemek, sitenizi hizmet reddi (DoS) saldırılarına karşı korumaya yardımcı olacaktır.

### `fileFilter`

Hangi dosyaların karşıya yükleneceğini ve hangilerinin atlanacağını kontrol etmek için bunu bir işleve(fonksiyonu) ayarlayın. İşlev şu şekilde görünmelidir:

```javascript
function fileFilter(req, file, cb) {
	// İşlev(fonksiyon), bir boolean ile `cb`yi çağırmalıdır
	// dosyanın kabul edilip edilmeyeceğini belirtmek için

	// Bu dosyayı reddetmek için `false` verin, şöyle:
	cb(null, false);

	// Bu dosyayı kabul etmek için `true` verin, şöyle:
	cb(null, true);

	// Bir şeyler ters gitme ihtimaline karşı oluşacak hata için hata mesajı iletebilirsiniz:
	cb(new Error("I don't have a clue!"));
}
```

## Hata yönetimi

Bir hatayla karşılaşıldığında, Multer hatayı Express'e devreder. [klasik ekspres hata yakalama yöntemi](http://expressjs.com/guide/error-handling.html) kullanarak güzel bir hata sayfası görüntüleyebilirsiniz.

Özellikle Multer'dan gelen hataları yakalamak istiyorsanız, ara katman(middleware) işlevini kendiniz çağırabilirsiniz. Ayrıca, yalnızca [Multer hatalarını](https://github.com/expressjs/multer/blob/master/lib/multer-error.js) yakalamak istiyorsanız, ekli `MulterError` sınıfını kullanabilirsiniz. `multer` nesnesinin kendisine aittir(ör. `err instanceof multer.MulterError`).

```javascript
const multer = require("multer");
const upload = multer().single("avatar");

app.post("/profile", function (req, res) {
	upload(req, res, function (err) {
		if (err instanceof multer.MulterError) {
			// Yükleme sırasında bir Multer hatası oluştu.
		} else if (err) {
			// Yükleme sırasında bilinmeyen bir hata oluştu.
		}

		// Her şey yolunda gitti.
	});
});
```

## Özel depolama motoru

Kendi depolama motorunuzu nasıl oluşturacağınız hakkında bilgi için bkz. [Multer Depolama Motoru](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## Lisans

[MIT](LICENSE)
