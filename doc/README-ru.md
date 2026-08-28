# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer — это middleware для node.js для обработки `multipart/form-data`, которая используется в первую очередь для загрузки файлов. Она написана
поверх [busboy](https://github.com/mscdex/busboy) для максимальной эффективности.

**ВАЖНО**: Multer не обрабатывает формы, которые не являются multipart (`multipart/form-data`).

## Переводы

Это README также доступно на других языках:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | Английский      |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Арабский        |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Китайский (упрощённый) |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | Французский     |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | Японский        |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | Индонезийский |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | Корейский       |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Португальский (Бразилия) |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | Испанский       |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | Тамильский      |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | Узбекский       |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | Вьетнамский     |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | Турецкий        |


## Установка

```sh
$ npm install multer
```

## Использование

Multer добавляет объект `body` и объект `file` или `files` в объект `request`. Объект `body` содержит значения текстовых полей формы, объект `file` или `files` содержит файлы, загруженные через форму.

Простой пример использования:

Не забывайте про `enctype="multipart/form-data"` в вашей форме.

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
  // req.file — это файл `avatar`
  // req.body будет содержать текстовые поля, если они были
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files — это массив файлов `photos`
  // req.body будет содержать текстовые поля, если они были
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files — это объект (String -> Array), где fieldname — ключ, а значение — массив файлов
  //
  // например:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body будет содержать текстовые поля, если они были
})
```

Если вам нужно обработать multipart-форму, содержащую только текст, используйте метод `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body содержит текстовые поля
})
```

Вот пример того, как multer используется в HTML-форме. Обратите особое внимание на поля `enctype="multipart/form-data"` и `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Затем в вашем javascript-файле нужно добавить следующие строки, чтобы получить доступ и к файлу, и к телу запроса. Важно использовать в функции загрузки значение поля `name` из формы. Оно сообщает multer, в каком поле запроса искать файлы. Если эти поля в HTML-форме и на сервере не совпадают, загрузка завершится ошибкой:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file — это имя вашего файла в форме выше, здесь 'uploaded_file'
  // req.body будет содержать текстовые поля, если они были
  console.log(req.file, req.body)
});
```



## API

### Информация о файле

Каждый файл содержит следующую информацию:

Ключ | Описание | Примечание
--- | --- | ---
`fieldname` | Имя поля, заданное в форме |
`originalname` | Имя файла на компьютере пользователя или полный путь при `preservePath: true` |
`encoding` | Кодировка файла |
`mimetype` | Mime-тип файла |
`size` | Размер файла в байтах |
`destination` | Каталог, в который был сохранён файл | `DiskStorage`
`filename` | Имя файла внутри `destination` | `DiskStorage`
`path` | Полный путь к загруженному файлу | `DiskStorage`
`buffer` | `Buffer` со всем содержимым файла | `MemoryStorage`

### `multer(opts)`

Multer принимает объект с опциями, самая базовая из которых — свойство `dest`,
указывающее Multer, куда загружать файлы. Если объект с опциями не передан,
файлы будут храниться в памяти и никогда не будут записаны на диск.

По умолчанию Multer переименовывает файлы, чтобы избежать конфликтов имён.
Функцию переименования можно настроить под ваши потребности.

Ниже перечислены опции, которые можно передать в Multer.

Ключ | Описание
--- | ---
`dest` или `storage` | Где сохранять файлы
`fileFilter` | Функция, определяющая, какие файлы принимать
`limits` | Ограничения на загружаемые данные
`preservePath` | Сохранять в `file.originalname` полный путь, присланный клиентом, а не только базовое имя файла
`defParamCharset` | Кодировка по умолчанию для значений параметров заголовков частей (например, имени файла), которые не являются расширенными параметрами (содержащими явное указание кодировки). По умолчанию: `'latin1'`

В обычном веб-приложении может понадобиться только `dest`, настроенный так, как
показано в следующем примере.

```javascript
const upload = multer({ dest: 'uploads/' })
```

Когда включён `preservePath`, Multer пропускает входящее имя файла вместе со
всеми сегментами пути, которые прислал клиент. Оно доступно как `file.originalname`;
при этом каталог назначения не меняется, каталоги не создаются, а путь
не очищается за вас. `file.originalname` всегда приходит от клиента и должен
считаться недоверенным; с `preservePath` он дополнительно содержит сегменты пути,
присланные клиентом. Нормализуйте или проверяйте его, прежде чем использовать
в собственной функции `filename` или в движке хранения.

Если вам нужен больший контроль над загрузками, используйте опцию `storage`
вместо `dest`. Multer поставляется с движками хранения `DiskStorage`
и `MemoryStorage`; другие движки доступны от сторонних разработчиков.

#### `.single(fieldname)`

Принимает один файл с именем `fieldname`. Этот файл будет сохранён
в `req.file`.

#### `.array(fieldname[, maxCount])`

Принимает массив файлов, все с именем `fieldname`. Опционально выдаёт ошибку,
если загружено больше `maxCount` файлов. Массив файлов будет сохранён в
`req.files`.

#### `.fields(fields)`

Принимает набор файлов, заданный через `fields`. Объект с массивами файлов
будет сохранён в `req.files`.

`fields` должен быть массивом объектов с полем `name` и опциональным `maxCount`.
Например:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Принимает только текстовые поля. При любой попытке загрузить файл будет выдана
ошибка с кодом "LIMIT\_UNEXPECTED\_FILE".

#### `.any()`

Принимает все файлы, которые приходят по сети. Массив файлов будет сохранён в
`req.files`.

**ПРЕДУПРЕЖДЕНИЕ:** Убедитесь, что вы всегда обрабатываете файлы, которые загружает пользователь.
Никогда не добавляйте multer как глобальную middleware, поскольку злоумышленник сможет загрузить
файлы на маршрут, который вы не предусмотрели. Используйте эту функцию только на маршрутах,
где вы обрабатываете загруженные файлы.

### `storage`

#### `DiskStorage`

Движок дискового хранения даёт вам полный контроль над сохранением файлов на диск.

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

Доступны две опции: `destination` и `filename`. Обе являются функциями,
которые определяют, где должен быть сохранён файл.

`destination` используется, чтобы определить, в каком каталоге должны быть
сохранены загруженные файлы. Также может быть задан строкой (например, `'/tmp/uploads'`). Если
`destination` не задан, используется каталог операционной системы по умолчанию
для временных файлов.

**Примечание:** Вы сами отвечаете за создание каталога, когда передаёте
`destination` в виде функции. При передаче строки multer сам позаботится о том,
чтобы каталог был создан.

`filename` используется, чтобы определить, как файл должен называться внутри каталога.
Если `filename` не задан, каждому файлу будет присвоено случайное имя без
расширения.

**Примечание:** Multer не добавляет расширение файла за вас, ваша функция
должна возвращать имя файла вместе с расширением.

Каждой функции передаются и запрос (`req`), и некоторая информация о файле
(`file`), чтобы помочь принять решение.

Обратите внимание, что `req.body` на этот момент может быть заполнен не полностью. Это зависит от
порядка, в котором клиент передаёт поля и файлы на сервер.

Чтобы разобраться в соглашении о вызове колбэка (необходимость передавать
null первым параметром), обратитесь к статье
[Node.js error handling](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Движок хранения в памяти сохраняет файлы в памяти в виде объектов `Buffer`. У него
нет никаких опций.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

При использовании хранения в памяти информация о файле будет содержать поле
`buffer`, в котором находится весь файл.

**ПРЕДУПРЕЖДЕНИЕ**: Загрузка очень больших файлов или относительно небольших файлов в большом
количестве за короткое время может привести к исчерпанию памяти вашим приложением, когда
используется хранение в памяти.

### `limits`

Объект, задающий ограничения размера для следующих необязательных свойств. Multer передаёт этот объект напрямую в busboy, подробности о свойствах можно найти на [странице busboy](https://github.com/mscdex/busboy#exports).

Доступны следующие целочисленные значения:

Ключ | Описание | По умолчанию
--- | --- | ---
`fieldNameSize` | Максимальный размер имени поля | Infinity
`fieldSize` | Максимальный размер значения поля (в байтах) | 1MB
`fields` | Максимальное количество нефайловых полей | Infinity
`fileSize` | Для multipart-форм — максимальный размер файла (в байтах) | Infinity
`files` | Для multipart-форм — максимальное количество файловых полей | Infinity
`parts` | Для multipart-форм — максимальное количество частей (поля + файлы) | Infinity
`headerPairs` | Для multipart-форм — максимальное количество разбираемых пар заголовков key=>value | 2000
`fieldNestingDepth` | Максимальное количество уровней вложенности в именах полей (например, `a[b][c]` имеет 2 уровня) | Infinity
`fieldArrayIndexLimit` | Максимальный числовой индекс массива, допустимый в имени поля (например, `a[3]` использует индекс 3) | Infinity

Ограничение `parts` срабатывает, когда busboy достигает заданного количества
частей, а не только после его превышения. Если вы хотите разрешить точное
количество полей и файлов, установите `parts` как минимум на единицу больше этой суммы.

Задание ограничений может помочь защитить ваш сайт от атак типа «отказ в обслуживании» (DoS).

### `fileFilter`

Задайте здесь функцию, чтобы управлять тем, какие файлы должны быть загружены, а какие
пропущены. Функция должна выглядеть так:

```javascript
function fileFilter (req, file, cb) {

  // Функция должна вызвать `cb` с булевым значением,
  // указывающим, следует ли принять файл

  // Чтобы отклонить этот файл, передайте `false`, вот так:
  cb(null, false)

  // Чтобы принять файл, передайте `true`, вот так:
  cb(null, true)

  // Вы всегда можете передать ошибку, если что-то пошло не так:
  cb(new Error('I don\'t have a clue!'))

}
```

## Безопасность

Задание [ограничений](#limits) может помочь защитить ваш сайт от атак типа «отказ в обслуживании» (DoS). Для большинства приложений рекомендуются следующие ограничения:

- `fileSize` -- установите в максимальный ожидаемый размер файла для вашего случая
- `files` -- установите в максимальное количество файлов на один запрос
- `fields` -- установите в максимальное количество текстовых полей на один запрос
- `fieldNestingDepth` -- установите в минимальную глубину, необходимую для ваших имён полей (например, `3` для `a[b][c]`)
- `fieldArrayIndexLimit` -- установите в наибольший индекс массива, необходимый для ваших имён полей (например, `100` для `a[99]`)

## Обработка ошибок

При возникновении ошибки Multer делегирует её обработку Express. Вы можете
показать аккуратную страницу ошибки [стандартным для express способом](https://expressjs.com/en/guide/error-handling/).

Если вы хотите перехватывать ошибки именно от Multer, вы можете вызвать
функцию middleware самостоятельно. Кроме того, если вы хотите перехватывать только [ошибки Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js), вы можете использовать класс `MulterError`, который привязан к самому объекту `multer` (например, `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // При загрузке произошла ошибка Multer.
    } else if (err) {
      // При загрузке произошла неизвестная ошибка.
    }

    // Всё прошло успешно.
  })
})
```

## Собственный движок хранения

Информацию о том, как создать собственный движок хранения, смотрите в [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md).

## Лицензия

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
