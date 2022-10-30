# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer — это middleware для фреймворка express для обработки `multipart/form-data`, нужная в первую очередь при загрузке файлов. Написана как обертка над [busboy](https://github.com/mscdex/busboy) для ее максимально эффективного использования.

**ВАЖНО**: Multer не обрабатывает никакой другой тип форм, кроме `multipart/form-data`.

## Переводы 

Это README также доступно на других языках:

- [العربية](https://github.com/expressjs/multer/blob/master/doc/README-ar.md) (арабский)
- [English](https://github.com/expressjs/multer/blob/master/README.md) (Английский)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (Испанский)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (Китайский)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (Корейский)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (бр Португальский)

## Установка

```sh
$ npm install --save multer
```

## Использование

Multer добавляет объект `body` и объект `file` (или `files`) внутрь объекта `request`. Объект `body` содержит значения текстовых полей формы, объект `file` (`files`) содержит файл или файлы, загружаемые через форму.

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
  // req.file - файл `avatar`
  // req.body сохранит текстовые поля, если они будут
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files - массив файлов `photos`
  // req.body сохранит текстовые поля, если они будут
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files - объект (String -> Array), где fieldname - ключ, и значение - массив файлов
  //
  // например:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body сохранит текстовые поля, если они будут
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

## API

### Информация о файлах

Каждый файл содержит следующую информацию:

Ключ | Описание | Замечания
--- | --- | ---
`fieldname` | Имя поля, заданное в форме |
`originalname` | Имя файла на компьютере пользователя |
`encoding` | Кодировка файла |
`mimetype` | Mime-тип файла |
`size` | Размер файла в байтах |
`destination` | Каталог, где будет сохранен файл | `DiskStorage`
`filename` | Имя файла без `destination` | `DiskStorage`
`path` | Полный путь к загружаемому файлу | `DiskStorage`
`buffer` | `Buffer` из всего файла | `MemoryStorage`

### `multer(opts)`

Multer принимает объект с опциями. Базовая опция `dest` указывает Multer, куда загружать файлы. Если вы не указываете объект с опциями, файлы будут находиться в памяти и не будут записаны на диск.

По умолчанию, Multer переименовывает файлы, чтобы избежать конфликтов. Это настраиваемо под ваши потребности.

Следующие опции могут быть переданы Multer.

Ключ | Описание
--- | ---
`dest` или `storage` | Где сохранять файлы
`fileFilter` | Функция для контроля принятия файлов
`limits` | Ограничения по загрузке
`preservePath` | Сохранять полный путь к файлам вместо только базового имени

Обычно для веб-приложения нужно обязательно переопределить `dest`, как показано в примере ниже.

```javascript
const upload = multer({ dest: 'uploads/' })
```
Если вам нужно больше возможностей для управления приложением, можно использовать `storage` вместо `dest`. Multer поставляется с двумя движками работы с памятью, `DiskStorage` и `MemoryStorage`, другие движки можно найти у сторонних разработчиков.

#### `.single(fieldname)`

Принимает один файл с именем `fieldname`. Файл будет сохранен в `req.file`.

#### `.array(fieldname[, maxCount])`

Принимает массив файлов с именем `fieldname`. Опционально можно задать ошибку при попытке загрузки более `maxCount` файлов. Массив файлов будет сохранен в `req.files`.

#### `.fields(fields)`

Принимает набор файлов, определенных в `fields`. Объект с массивом файлов будет сохранен в `req.files`.

`fields` должен быть массивом объектов с полями `name` и опциональным `maxCount`.
Например:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Принимает только текстовые поля формы. При попытке загрузки файла падает с ошибкой "LIMIT\_UNEXPECTED\_FILE".

#### `.any()`

Принимает все переданные файлы. Массив файлов будет сохранен в `req.files`.

**ПРЕДУПРЕЖДЕНИЕ:** Убедитесь в корректной обработке загрузки файлов вашим приложением. Никогда не используйте Multer как middleware глобально, если пользователь может загрузить вредоносные файлы, и тем самым нарушить работу вашего приложения. Используйте этот метод, только если вы полностью управляете процессом загрузки файлов.

### `storage`

#### `DiskStorage`

Движок дискового пространства. Дает полный контроль над размещением файлов на диск. 

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

Доступно две опции, расположение `destination` и имя файла `filename`. Обе эти функции определяют, где будет находиться файл после загрузки. 

`destination` используется, чтобы задать каталог, в котором будут размещены файлы. Может быть задан строкой (например, `'/tmp/uploads'`). Если не задано расположение `destination`, операционная система воспользуется для сохранения каталогом для временных файлов.

**Важно:** Вы должны создать каталог, когда используете `destination`. При передачи в качестве аргумента строки, Multer проверяет, что каталог создан. 

`filename` используется, чтобы определить, как будет назван файл внутри каталога. Если 
имя файла `filename` не задано, каждому файлу будет сконфигурировано случайное имя без расширения файла.

**Важно:** Multer не добавляет никакого файлового расширения, ваша функция должна возвращать имя файла с необходимым расширением.

В аргументах каждой функции прокидывается запрос (`req`) и набор информации о файле (`file`).

Обратите внимание, что `req.body` может быть не полностью заполнено. Это зависит от порядка отправки клиентом полей и файлов на сервер.

#### `MemoryStorage`

Движок оперативной памяти сохраняет файлы в памяти как объекты типа `Buffer`. В этом случае нет никаких дополнительных опций.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```
Когда вы используете этот тип передачи, информация о файле будет содержать поле `buffer`, которое содержит весь файл. 

**ПРЕДУПРЕЖДЕНИЕ**: Загрузка очень больших файлов, или относительно небольших файлов в большом количестве может вызвать переполнение памяти.

### `limits`

Объект, устанавливающий ограничения. Multer прокидывает этот объект напрямую в busboy, поэтому детали можно посмотреть 
[на странице с методами busboy](https://github.com/mscdex/busboy#busboy-methods).

Доступны следующие целочисленные значения:

Ключ | Описание | Значение по умолчанию
--- | --- | ---
`fieldNameSize` | Максимальный размер имени файла | 100 bytes
`fieldSize` | Максимальный размер значения поля | 1MB
`fields` | Максимальное количество не-файловых полей | Не ограничено
`fileSize` | Максимальный размер файла в байтах для multipart-форм | Не ограничен
`files` | Максимальное количество полей с файлами для multipart-форм | Не ограничено
`parts` | Максимальное количество полей с файлами для multipart-форм (поля плюс файлы) | Не ограничено
`headerPairs` | Максимальное количество пар ключ-значение key=>value для multipart-форм, которое обрабатывается | 2000

Установка ограничений может помочь защитить ваш сайт от DoS-атак.

### `fileFilter`

Задают функцию для того, чтобы решать, какие файлы будут загружены, а какие — нет. Функция может выглядеть так: 

```javascript
function fileFilter (req, file, cb) {

  // Функция должна вызывать `cb` с булевым значением,
  // которое показывает, следует ли принять файл

  // Чтобы отклонить, прокиньте в аргументы `false` так:
  cb(null, false)

  // Чтобы принять файл, используется как аргумент `true` таким образом:
  cb(null, true)

  // Вы можете всегда вернуть ошибку, если что-то пошло не так:
  cb(new Error('I don\'t have a clue!'))

}
```

## Обработка ошибок

Когда выбрасывается исключение, Multer делегирует его обработку Express. Вы можете выводить страницу ошибки [стандартными для express способами](http://expressjs.com/guide/error-handling.html).

Если вы хотите отлавливать ошибки конкретно от Multer, вам нужно вызывать собственную middleware для их обработки. Еще, если вы хотите отлавливать [исключительно ошибки Multer](https://github.com/expressjs/multer/blob/master/lib/make-error.js#L1-L9), вы можете использовать класс `MulterError`, который привязан к объекту `multer` (например, `err instanceof multer.MulterError`)

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Случилась ошибка Multer при загрузке.
    } else {
      // При загрузке произошла неизвестная ошибка.
    }

    // Все прекрасно загрузилось.
  })
})
```

## Собственные движки для сохранения файлов

Чтобы получить информацию, как создать собственный движок для обработки загрузки файлов, смотрите страницу [Multer Storage Engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## Лицензия

[MIT](LICENSE)
