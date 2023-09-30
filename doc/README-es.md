# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer es un "*middleware*" de node.js para el manejo de `multipart/form-data`, el cuál es usado sobre todo para la subida de archivos. Está escrito sobre [busboy](https://github.com/mscdex/busboy) para maximizar su eficiencia.

**NOTA**: Multer no procesará ningún formulario que no sea multiparte (`multipart/form-data`).

## Traducciones

Éste archivo README también está disponible en otros lenguajes:

- [Bahasa Indonesia](https://github.com/expressjs/multer/blob/master/doc/README-id.md) (Indonesia)
- [English](https://github.com/expressjs/multer/blob/master/README.md) (Inglés)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (Chino)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (Coreano)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (Ruso)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (Portugués Brasileño)

## Instalación

```sh
$ npm install --save multer
```

## Uso

Multer añade un objeto `body` y un objeto `file` o `files` al objeto `request`. El objeto `body` contiene los valores correspondientes a los campos de texto del formulario, los objetos `file` o `files` contienen los archivos que serán subidos mediante el formulario.

Ejemplo básico de cómo usarlo:

No te olvides de `enctype="multipart/form-data"` en tu formulario.

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
  // req.file es el archivo del `avatar`
  // req.body contendrá los campos de texto, si los hubiera.
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files es el arreglo (array) de archivos `photos`
  // req.body contendrá los campos de texto, si los hubiera.
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files es un objeto (String -> Array) donde el nombre del campo es la clave (key) y el valor es el arreglo (array) de archivos
  //
  // Ejemplo
  //  req.files['avatar'][0] -> Archivo
  //  req.files['gallery'] -> Array
  //
  // req.body contendrá los campos de texto, si los hubiera.
})
```

En caso de que necesites manejar un formulario multiparte (multipart form) que sólo contiene campos de texto, deberias usar el método `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body contiene los campos textuales
})
```


Este es un ejemplo de cómo se utiliza multer en un formulario HTML. Presta especial atención en los campos `enctype="multipart/form-data"` y `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">            
  </div>
</form>
```

Luego en tu archivo javascript agrega estas líneas para acceder tanto al archivo (file) como al body.Es importante que uses el valor del campo `name` del formulario, en tu función de subida. Esto le indica a multer en qué campo de la petición debe buscar los archivos. Si estos campos no son los mismos en el formulario HTML y en tu servidor, la subida fallará:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
   // req.file es el nombre de tu archivo en el formulario anterior, en este caso 'uploaded_file'
   // req.body contendrá los campos de texto, si los hubiera.
   console.log(req.file, req.body)
});
```



## API

### Información del archivo

Cada archivo contiene la siguiente información:

Clave (Key) | Descripción | Nota
--- | --- | ---
`fieldname` | Nombre del campo especificado en el formulario |
`originalname` | Nombre del archivo en la computadora del usuario |
`encoding` | Tipo de codificación del archivo |
`mimetype` | Mime type del archivo |
`size` | Tamaño del archivo en Bytes |
`destination` | La carpeta donde se guardó el archivo | `DiskStorage`
`filename` | El nombre del archivo en `destination` | `DiskStorage`
`path` | La ruta completa al archivo subido | `DiskStorage`
`buffer` | Un `Buffer` del archivo completo | `MemoryStorage`

### `multer(opts)`

Multer acepta un objeto para configurar sus opciones, la más básica de ellas es la propiedad `dest`, la cual informa a Multer dónde debe subir los archivos. En caso de que omitas el objeto con las opciones, los archivos serán guardados en la memoria y nunca serán escritos en el disco.

Por defecto, Multer renombrará los archivos para evitar conflictos de nombres. La función usada para renombrarlos puede ser modificada acorde a tus necesidades.

Las siguientes son las opciones que pueden ser utilizadas con Multer.

Clave (key) | Descripción
--- | ---
`dest` o `storage` | Donde se guardarán los archivos
`fileFilter` | Función para controlar qué archivos son aceptados
`limits` | Límites de los datos subidos
`preservePath` | Mantiene la ruta completa de la ubicación de los archivos, en vez de sólo sus nombres

En la aplicación web promedio es probable que sólo se requiera `dest`, siendo configurado como en el siguiente ejemplo:

```javascript
const upload = multer({ dest: 'uploads/' })
```

Si quieres más control sobre tus subidas, tendrás que usar la opción `storage` en vez de `dest`. Multer incorpora los mecanismos de almacenamiento `DiskStorage` y `MemoryStorage`; existen otros medios provistos por terceros.

#### `.single(fieldname)`

Acepta un único archivo con el nombre `fieldname`. Dicho archivo será guardado en `req.file`.

#### `.array(fieldname[, maxCount])`

Acepta un arreglo (array), de archivos, todos con el nombre `fieldname`. Opcionalmente puede generarse un error si se intentan subir una cantidad de archivos superior a `maxCount`. El arreglo (array) de archivos será guardado en `req.files`.

#### `.fields(fields)`

Acepta una mezcla de archivos, especificados por `field`. Un objeto con arreglos (arrays) de archivos será guardado en `req.files`

`fields` debería ser un arreglo (array) de objetos con `name` y opcionalmente `maxCount`.
Ejemplo:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Acepta sólo campos de texto. En caso de intentar subir un archivo, se generará un error con el siguiente código
"LIMIT\_UNEXPECTED\_FILE".

#### `.any()`

Acepta todos los archivos que han sido enviados. Un arreglo (array) conteniendo los archivos, será guardado en `req.files`.

**ADVERTENCIA:** Asegúrate de siempre manejar los archivos que los usuarios intenten subir. Nunca uses Multer como una función middleware de manera global dado que, de esta forma, un usuario malicioso podría subir archivos por medio de rutas que no has anticipado. Usa sólo esta función en rutas en las que estás esperando archivos.

### `storage`

#### `DiskStorage`

El motor de almacenamiento en disco te ofrece un control total sobre el almacenamiento de archivos en tu disco.

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

Hay dos opciones disponibles, `destination` y `filename`. Ambas son funciones que determinan dónde debería almacenarse el archivo.

`destination` se utiliza para determinar en qué carpeta se almacenarán los archivos subidos. Tambien se puede proporcionar como un `string` (por ejemplo: `'/tmp/uploads'`). Si no se proporciona `destination`, se utilizara el directorio predeterminado del sistema operativo para archivos temporales.

**Nota:** Al pasar `destination` como una función, tú eres el responsable de crear los directorios donde los archivos serán almacenados. Cuando asignas un `string` a `destination`, Multer se asegurará de que el directorio sea creado en caso de no encontrarlo.

`filename` es usado para determinar cómo debería ser nombrado el archivo dentro de la carpeta. Si `filename` no es provisto, a cada archivo se le asignará un nombre aleatorio que no incluirá ninguna extensión.

**Nota:** Multer no añadirá ningúna extensión de archivos por ti, es tu función la que debería retornar un nombre completo, que incluya también la extensión del archivo.

El objeto petición (`req`) y parte de la información del archivo (`file`) son pasadas a tu función para ayudar con la decisión en la nomenclatura.

Nota que  `req.body` puede que no haya sido totalmente poblado todavía. Esto depende del orden en el que el cliente transmita sus campos y archivos hacia el servidor.

Para comprender la convención de llamada utilizada en el callback (necesitas pasar null como primer parametro), consulta en
[Node.js manejo de errores](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

El motor de almacenamiento en memoria almacena los archivos en memoria como objetos `Buffer`. Para esto no se proveen opciones.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Al usar el almacenamiento en memoria, la información del archivo contendrá un campo llamado `buffer` que contiene el archivo entero.

**ADVERTENCIA**: Subir archivos grandes, o relativamente pequeños pero en gran cantidad y muy rápido, puede provocar que tu aplicación se quede sin memoria cuando es usado el almacenamiento en memoria.

### `limits`

Un objeto especifica los límites correpondientes a los tamaños de las siguientes propiedades opcionales. Multer pasa este objeto directamente a *busboy*, los detalles de las propiedades pueden encontrarse en [la página de busboy](https://github.com/mscdex/busboy#busboy-methods).

Los siguientes valores en números enteros están disponibles:

Clave (Key) | Descripción | Por defecto
--- | --- | ---
`fieldNameSize` | Tamaño máximo del nombre del campo | 100 bytes
`fieldSize` | Tamaño máximo de los valores para cada campo (en bytes) | 1MB
`fields` | Número máximo de campos que no son archivos | Infinito
`fileSize` | Para formularios multiparte, el tamaño máximo de los archivos (en bytes) | Infinito
`files` | Para los formularios multiparte, el número máximo de campos para archivos | Infinito
`parts` | Para los formularios multiparte, el número máximo de partes (campos + archivos) | Infinito
`headerPairs` | Para los formularios multiparte, el número máximo de cabeceras de pares clave=>valor para analizar | 2000

Especificar los límites puede ayudarte a proteger tu sitio contra ataques de denegación del servicio (DoS).

### `fileFilter`

Asigna ésto a una función para controlar cuáles archivos deben ser subidos y cuáles deben ser omitidos. La función debería verse como ésta:

```javascript
function fileFilter (req, file, cb) {

  // La función debe llamar a `cb` usando una variable del tipo boolean
  // para indicar si el archivo debería ser aceptado o no

  // Para rechazar el archivo es necesario pasar `false`, de la siguiente forma:
  cb(null, false)

  // Para aceptar el archivo es necesario pasar `true`, de la siguiente forma:
  cb(null, true)

  // Siempre puedes pasar un error en caso de que algo salga mal:
  cb(new Error('No tengo la menor idea!'))

}
```

## Manejo de errores

Al encontrarse con un error, Multer delegará ese error a Express. Puedes mostrar una linda página de error usando [la manera standard de Express](http://expressjs.com/guide/error-handling.html).

Si quieres capturar los errores específicamente desde Multer, puedes llamar la función middleware tú mismo. También, si quieres capturar sólo [los errores de Multer](https://github.com/expressjs/multer/blob/master/lib/multer-error.js), puedes usar la clase `MulterError` que está adherida al mismo objeto `multer` (por ejemplo: `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Un error de Multer ocurrió durante la subida.
    } else if (err) {
      // Un error desconocido ocurrió durante la subida.
    }

    // Todo salió bien.
  })
})
```

## Mecanismos de almacenamiento personalizados

Para más información acerca de cómo construir tu propio mecanismo de almacenamiento, recomendamos leer [Multer Storage Engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## Licencia

[MIT](LICENSE)
