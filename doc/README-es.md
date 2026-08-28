# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer es un middleware de node.js para el manejo de `multipart/form-data`, que se usa principalmente para la subida de archivos. Está escrito
sobre [busboy](https://github.com/mscdex/busboy) para lograr la máxima eficiencia.

**NOTA**: Multer no procesará ningún formulario que no sea multiparte (`multipart/form-data`).

## Traducciones

Este README también está disponible en otros idiomas:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | Inglés          |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Árabe           |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Chino (simplificado) |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | Francés         |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | Japonés         |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | Indonesio    |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | Coreano         |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Portugués (BR)  |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Ruso            |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | Tamil           |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | Uzbeko          |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | Vietnamita      |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | Turco           |


## Instalación

```sh
$ npm install multer
```

## Uso

Multer añade un objeto `body` y un objeto `file` o `files` al objeto `request`. El objeto `body` contiene los valores de los campos de texto del formulario; el objeto `file` o `files` contiene los archivos subidos mediante el formulario.

Ejemplo básico de uso:

No olvides el `enctype="multipart/form-data"` en tu formulario.

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
  // req.file es el archivo `avatar`
  // req.body contendrá los campos de texto, si los hubiera
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files es un array de archivos `photos`
  // req.body contendrá los campos de texto, si los hubiera
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files es un objeto (String -> Array) donde fieldname es la clave y el valor es un array de archivos
  //
  // p. ej.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body contendrá los campos de texto, si los hubiera
})
```

En caso de que necesites manejar un formulario multiparte que solo contiene texto, debes usar el método `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body contiene los campos de texto
})
```

Este es un ejemplo de cómo se usa multer en un formulario HTML. Presta especial atención a los campos `enctype="multipart/form-data"` y `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Luego, en tu archivo javascript, añadirías estas líneas para acceder tanto al archivo como al body. Es importante que uses el valor del campo `name` del formulario en tu función de subida. Esto le indica a multer en qué campo de la petición debe buscar los archivos. Si estos campos no coinciden entre el formulario HTML y tu servidor, la subida fallará:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file es el nombre de tu archivo en el formulario anterior, aquí 'uploaded_file'
  // req.body contendrá los campos de texto, si los hubiera
  console.log(req.file, req.body)
});
```



## API

### Información del archivo

Cada archivo contiene la siguiente información:

Clave | Descripción | Nota
--- | --- | ---
`fieldname` | Nombre del campo especificado en el formulario |
`originalname` | Nombre del archivo en el equipo del usuario, o la ruta completa cuando `preservePath: true` |
`encoding` | Tipo de codificación del archivo |
`mimetype` | Tipo MIME del archivo |
`size` | Tamaño del archivo en bytes |
`destination` | La carpeta en la que se ha guardado el archivo | `DiskStorage`
`filename` | El nombre del archivo dentro de `destination` | `DiskStorage`
`path` | La ruta completa al archivo subido | `DiskStorage`
`buffer` | Un `Buffer` con el archivo completo | `MemoryStorage`

### `multer(opts)`

Multer acepta un objeto de opciones, la más básica de las cuales es la propiedad
`dest`, que le indica a Multer dónde subir los archivos. En caso de que omitas el
objeto de opciones, los archivos se mantendrán en memoria y nunca se escribirán en disco.

Por defecto, Multer renombrará los archivos para evitar conflictos de nombres. La
función de renombrado puede personalizarse según tus necesidades.

Las siguientes son las opciones que se pueden pasar a Multer.

Clave | Descripción
--- | ---
`dest` o `storage` | Dónde almacenar los archivos
`fileFilter` | Función para controlar qué archivos se aceptan
`limits` | Límites de los datos subidos
`preservePath` | Conserva la ruta completa proporcionada por el cliente en `file.originalname` en lugar de solo el nombre base
`defParamCharset` | Conjunto de caracteres por defecto que se usará para los valores de los parámetros de cabecera de cada parte (p. ej. filename) que no sean parámetros extendidos (que incluyen un charset explícito). Por defecto: `'latin1'`

En una aplicación web típica, puede que solo se necesite `dest`, configurado como se
muestra en el siguiente ejemplo.

```javascript
const upload = multer({ dest: 'uploads/' })
```

Cuando `preservePath` está habilitado, Multer deja pasar el nombre de archivo entrante
con todos los segmentos de ruta proporcionados por el cliente. Esto se expone como `file.originalname`;
no cambia la carpeta de destino, no crea directorios ni sanea la
ruta por ti. `file.originalname` siempre lo proporciona el cliente y debe tratarse
como no confiable; con `preservePath` contiene además los segmentos de ruta que
envió el cliente. Normalízalo o valídalo antes de usarlo en un `filename` personalizado o
en un motor de almacenamiento.

Si quieres más control sobre tus subidas, deberás usar la opción `storage`
en lugar de `dest`. Multer incluye los motores de almacenamiento `DiskStorage`
y `MemoryStorage`; hay más motores disponibles de terceros.

#### `.single(fieldname)`

Acepta un único archivo con el nombre `fieldname`. Ese único archivo se almacenará
en `req.file`.

#### `.array(fieldname[, maxCount])`

Acepta un array de archivos, todos con el nombre `fieldname`. Opcionalmente genera un error si
se suben más de `maxCount` archivos. El array de archivos se almacenará en
`req.files`.

#### `.fields(fields)`

Acepta una mezcla de archivos, especificada por `fields`. Un objeto con arrays de archivos
se almacenará en `req.files`.

`fields` debe ser un array de objetos con `name` y, opcionalmente, un `maxCount`.
Ejemplo:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Acepta solo campos de texto. Si se intenta subir cualquier archivo, se emitirá un error con el código
"LIMIT\_UNEXPECTED\_FILE".

#### `.any()`

Acepta todos los archivos que llegan por la red. Un array de archivos se almacenará en
`req.files`.

**ADVERTENCIA:** Asegúrate de manejar siempre los archivos que sube un usuario.
Nunca añadas multer como middleware global, ya que un usuario malicioso podría subir
archivos a una ruta que no habías previsto. Usa esta función solo en las rutas
donde manejes los archivos subidos.

### `storage`

#### `DiskStorage`

El motor de almacenamiento en disco te da control total sobre el almacenamiento de archivos en disco.

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

Hay dos opciones disponibles, `destination` y `filename`. Ambas son
funciones que determinan dónde debe almacenarse el archivo.

`destination` se usa para determinar en qué carpeta deben almacenarse los archivos
subidos. También se puede proporcionar como un `string` (p. ej. `'/tmp/uploads'`). Si no se
proporciona `destination`, se usa el directorio por defecto del sistema operativo para archivos
temporales.

**Nota:** Tú eres responsable de crear el directorio cuando proporcionas
`destination` como función. Cuando pasas un string, multer se asegurará de que
el directorio se cree por ti.

`filename` se usa para determinar cómo debe llamarse el archivo dentro de la carpeta.
Si no se proporciona `filename`, a cada archivo se le asignará un nombre aleatorio que no
incluye ninguna extensión de archivo.

**Nota:** Multer no añadirá ninguna extensión de archivo por ti; tu función
debe devolver un nombre de archivo completo, con su extensión.

A cada función se le pasan tanto la petición (`req`) como cierta información sobre
el archivo (`file`) para ayudar en la decisión.

Ten en cuenta que puede que `req.body` aún no se haya rellenado por completo. Depende del
orden en que el cliente transmita los campos y archivos al servidor.

Para entender la convención de llamada usada en el callback (la necesidad de pasar
null como primer parámetro), consulta
[Manejo de errores en Node.js](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

El motor de almacenamiento en memoria almacena los archivos en memoria como objetos `Buffer`. No
tiene ninguna opción.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Al usar el almacenamiento en memoria, la información del archivo contendrá un campo llamado
`buffer` que contiene el archivo completo.

**ADVERTENCIA**: Subir archivos muy grandes, o archivos relativamente pequeños en gran
cantidad y muy rápidamente, puede hacer que tu aplicación se quede sin memoria cuando
se usa el almacenamiento en memoria.

### `limits`

Un objeto que especifica los límites de tamaño de las siguientes propiedades opcionales. Multer pasa este objeto directamente a busboy, y los detalles de las propiedades se pueden consultar en [la página de busboy](https://github.com/mscdex/busboy#exports).

Están disponibles los siguientes valores enteros:

Clave | Descripción | Por defecto
--- | --- | ---
`fieldNameSize` | Tamaño máximo del nombre de campo | Infinity
`fieldSize` | Tamaño máximo del valor de campo (en bytes) | 1MB
`fields` | Número máximo de campos que no son archivos | Infinity
`fileSize` | Para formularios multiparte, el tamaño máximo de archivo (en bytes) | Infinity
`files` | Para formularios multiparte, el número máximo de campos de archivo | Infinity
`parts` | Para formularios multiparte, el número máximo de partes (campos + archivos) | Infinity
`headerPairs` | Para formularios multiparte, el número máximo de pares clave=>valor de cabecera a analizar | 2000
`fieldNestingDepth` | Número máximo de niveles de anidamiento en los nombres de campo (p. ej. `a[b][c]` tiene 2 niveles) | Infinity
`fieldArrayIndexLimit` | Índice numérico de array máximo aceptado dentro de un nombre de campo (p. ej. `a[3]` usa el índice 3) | Infinity

El límite `parts` se activa cuando busboy alcanza el número de partes
configurado, no solo cuando se supera ese número. Si quieres permitir un número
exacto de campos y archivos, establece `parts` en al menos uno más que ese total.

Especificar los límites puede ayudar a proteger tu sitio contra ataques de denegación de servicio (DoS).

### `fileFilter`

Asigna aquí una función para controlar qué archivos deben subirse y cuáles
deben omitirse. La función debe tener este aspecto:

```javascript
function fileFilter (req, file, cb) {

  // La función debe llamar a `cb` con un booleano
  // para indicar si el archivo debe aceptarse

  // Para rechazar este archivo pasa `false`, así:
  cb(null, false)

  // Para aceptar el archivo pasa `true`, así:
  cb(null, true)

  // Siempre puedes pasar un error si algo sale mal:
  cb(new Error('I don\'t have a clue!'))

}
```

## Seguridad

Especificar los [limits](#limits) puede ayudar a proteger tu sitio contra ataques de denegación de servicio (DoS). Se recomiendan los siguientes límites para la mayoría de las aplicaciones:

- `fileSize` -- establécelo en el tamaño máximo de archivo esperado para tu caso de uso
- `files` -- establécelo en el número máximo de archivos por petición
- `fields` -- establécelo en el número máximo de campos de texto por petición
- `fieldNestingDepth` -- establécelo en la profundidad mínima que requieran tus nombres de campo (p. ej. `3` para `a[b][c]`)
- `fieldArrayIndexLimit` -- establécelo en el índice de array más alto que requieran tus nombres de campo (p. ej. `100` para `a[99]`)

## Manejo de errores

Al encontrar un error, Multer lo delegará a Express. Puedes
mostrar una página de error agradable usando [la forma estándar de express](https://expressjs.com/en/guide/error-handling/).

Si quieres capturar específicamente los errores de Multer, puedes llamar a la
función middleware tú mismo. Además, si quieres capturar solo [los errores de Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js), puedes usar la clase `MulterError` que está adjunta al propio objeto `multer` (p. ej. `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Ocurrió un error de Multer durante la subida.
    } else if (err) {
      // Ocurrió un error desconocido durante la subida.
    }

    // Todo salió bien.
  })
})
```

## Motor de almacenamiento personalizado

Para obtener información sobre cómo construir tu propio motor de almacenamiento, consulta [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md).

## Licencia

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
