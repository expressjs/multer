# Multer [![Build Status](https://travis-ci.org/expressjs/multer.svg?branch=master)](https://travis-ci.org/expressjs/multer) [![NPM version](https://badge.fury.io/js/multer.svg)](https://badge.fury.io/js/multer) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

Multer est un middleware node.js pour la gestion des données `multipart/form-data` qui est principalement utilisé pour télécharger des fichiers. 
Il est écrit au-dessus de [busboy](https://github.com/mscdex/busboy) pour une efficacité maximale.

**NOTE**: Multer ne traitera aucun formulaire qui ne soit pas un multipart (`multipart/form-data`).

## Translations

This README is also available in other languages:

- [العربية](https://github.com/expressjs/multer/blob/master/doc/README-ar.md) (Arabe)
- [Español](https://github.com/expressjs/multer/blob/master/doc/README-es.md) (Espagnol)
- [简体中文](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md) (Chinois)
- [한국어](https://github.com/expressjs/multer/blob/master/doc/README-ko.md) (Coréen)
- [Русский язык](https://github.com/expressjs/multer/blob/master/doc/README-ru.md) (Russe)
- [Việt Nam](https://github.com/expressjs/multer/blob/master/doc/README-vi.md) (Vietnamien)
- [Português](https://github.com/expressjs/multer/blob/master/doc/README-pt-br.md) (Portugais du Brésil)
- [Français](https://github.com/expressjs/multer/blob/master/doc/README-fr.md) (Français)

## Installation

```sh
$ npm install --save multer
```

## Usage

Multer ajoute un objet `body` et un objet `file` ou `files` à l'objet `request`. L'objet `body` contient les valeurs des champs texte du formulaire, l'objet `file` ou `files` contient les fichiers téléchargés via le formulaire.

Exemple d'utilisation de base :

N'oubliez pas le `enctype="multipart/form-data"` dans votre formulaire.

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
  // req.file est le fichier `avatar`
  // req.body contiendra les champs de texte, s'il y en avait
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files est un tableau de fichiers "photos"
  // req.body contiendra les champs de texte, s'il y en avait
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files est un objet (String -> Array) où fieldname est la clé et la valeur est un tableau de fichiers
  //
  // e.g.
  //  req.files['avatar'][0] -> Fichier
  //  req.files['gallery'] -> Tableau
  //
  // req.body contiendra les champs de texte, s'il y en avait
})
```

Dans le cas où vous auriez besoin de gérer un formulaire en plusieurs parties texte uniquement, vous devez utiliser la méthode `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body contiens les champs de text
})
```

Voici un exemple d'utilisation de multer dans un formulaire HTML. Faites particulièrement attention aux champs `enctype="multipart/form-data"` et `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">            
  </div>
</form>
```

Ensuite, dans votre fichier javascript, vous ajouterez ces lignes pour accéder à la fois au fichier et au corps. Il est important que vous utilisiez la valeur du champ `name` du formulaire dans votre fonction de téléchargement. Cela indique à Multer dans quel champ de la requête il doit rechercher les fichiers. Si ces champs ne sont pas les mêmes dans le formulaire HTML et sur votre serveur, votre téléchargement échouera:
```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file est le nom de votre fichier dans le formulaire ci-dessus, ici 'uploaded_file'
  // req.body contiendra les champs de texte, s'il y en avait
  console.log(req.file, req.body)
});
```
## API

### Informations sur les fichiers

Chaque fichier contient les informations suivantes:

Clé | Description                                    | Notes
--- |------------------------------------------------| ---
`fieldname` | Nom du champ spécifié dans le formulaire       |
`originalname` | Nom du fichier sur l'ordinateur de l'utilisateur |
`encoding` | Type d'encodage du fichier                     |
`mimetype` | Type Mime du fichier                           |
`size` | Taille du fichier en octets                      |
`destination` | TLe dossier dans lequel le fichier a été enregistré    | `DiskStorage`
`filename` | Le nom du fichier dans la `destination`    | `DiskStorage`
`path` | Le chemin d'accès complet au fichier téléchargé             | `DiskStorage`
`buffer` | Un `Buffer` du fichier entier                  | `MemoryStorage`

### `multer(opts)`

Multer accepte un objet d'options, dont le plus basique est le `dest`
propriété, qui indique à Multer où télécharger les fichiers. Au cas où vous omettez l'objet
options, les fichiers seront conservés en mémoire et ne seront jamais écrits sur le disque.

Par défaut, Multer renommera les fichiers afin d'éviter les conflits de nommage. Les
la fonction de renommage peut être personnalisée en fonction de vos besoins.

Voici les options qui peuvent être transmises à Multer.

Clé | Description
--- | ---
`dest` ou `storage` | Où stocker les fichiers
`fileFilter` | Fonction pour contrôler quels fichiers sont acceptés
`limits` | Limites des données téléchargées
`preservePath` | Conservez le chemin complet des fichiers au lieu du nom de base uniquement

Dans une application Web moyenne, seul `dest` peut être requis et configuré comme indiqué dans
l'exemple suivant.

```javascript
const upload = multer({ dest: 'uploads/' })
```

Si vous voulez plus de contrôle sur vos téléchargements, vous voudrez utiliser le `storage`
option au lieu de `dest`. Multer est livré avec des moteurs de stockage `DiskStorage`
et `MemoryStorage`; D'autres moteurs sont disponibles auprès de tiers.

#### `.single(fieldname)`

Acceptez un seul fichier avec le nom `fieldname`. Le fichier unique sera stocké
dans `req.file`.

#### `.array(fieldname[, maxCount])`

Acceptez un tableau de fichiers, tous avec le nom `fieldname`. Eventuellement erreur si
plus de `maxCount` fichiers sont téléchargés. Le tableau de fichiers sera stocké dans
`req.files`.

#### `.fields(fields)`

Accepte un mélange de fichiers, spécifié par `fields`. Un objet avec des tableaux de fichiers
seront stockés dans `req.files`.

`fields` doit être un tableau d'objets avec `name` et éventuellement un `maxCount`.
Exemple:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

N'acceptez que les champs de texte. Si un téléchargement de fichier est effectué, une erreur avec le code
"LIMIT\_UNEXPECTED\_FILE" sera émis.

#### `.any()`

Accepte tous les fichiers qui arrivent sur le fil. Un tableau de fichiers sera stocké dans
`req.files`.

**ATTENTION:** Assurez-vous de toujours gérer les fichiers qu'un utilisateur télécharge.
N'ajoutez jamais multer en tant que middleware global car un utilisateur malveillant pourrait télécharger des
fichiers vers un itinéraire que vous n'aviez pas prévu. N'utilisez cette fonction que sur les itinéraires
où vous gérez les fichiers téléchargés.

### `storage`

#### `DiskStorage`

Le moteur de stockage sur disque vous donne un contrôle total sur le stockage des fichiers sur le disque.

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

Il y a deux options disponibles, `destination` et `filename`. Elles sont toutes les deux
des fonctions qui déterminent où le fichier doit être stocké.

`destination` est utilisé pour déterminer dans quel dossier les fichiers téléchargés doivent
être stocké. Cela peut également être donné sous forme de `string` (par exemple `'/tmp/uploads'`). Sinon
`destination` est donné, le répertoire par défaut du système d'exploitation est utilisé pour les
fichiers temporaires.

**Remarque:** Vous êtes responsable de la création du répertoire lorsque vous fournissez
`destination` en tant que fonction. Lors du passage d'une chaîne, multer s'assurera que
le répertoire est créé pour vous.

`filename` est utilisé pour déterminer le nom du fichier dans le dossier.
Si aucun "nom de fichier" n'est donné, chaque fichier recevra un nom aléatoire qui n'inclut
pas d'extension de fichier.

**Remarque:** Multer n'ajoutera aucune extension de fichier pour vous, votre fonction
doit renvoyer un nom de fichier complet avec une extension de fichier.

Chaque fonction reçoit à la fois la requête (`req`) et des informations sur
le dossier (`file`) pour aider à la décision.

Notez que `req.body` n'a peut-être pas encore été entièrement rempli. Cela dépend de l'ordre 
où le client transmet les champs et les fichiers au serveur.

Pour comprendre la convention d'appel utilisée dans le rappel (nécessité de passer
null comme premier paramètre), reportez-vous à
[Node.js error handling](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Le moteur de stockage en mémoire stocke les fichiers en mémoire en tant qu'objets `Buffer`. Il
n'a pas d'options.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Lors de l'utilisation du stockage en mémoire, les informations sur le fichier contiendront un champ appelé
`buffer` qui contient le fichier entier.

**ATTENTION**: Le téléchargement de fichiers très volumineux ou de fichiers relativement petits en grand
nombres très rapidement, peut entraîner un manque de mémoire de votre application lorsque
le stockage en mémoire est utilisé.

### `limits`

Un objet spécifiant les limites de taille des propriétés facultatives suivantes. Multer passe directement cet objet dans busboy, et les détails des propriétés peuvent être trouvés sur [la page de busboy](https://github.com/mscdex/busboy#busboy-methods).

Les valeurs entières suivantes sont disponibles :

Clé | Description                                                               | Default
--- |---------------------------------------------------------------------------| ---
`fieldNameSize` | Taille maximale du nom de champ                                           | 100 bytes
`fieldSize` | Max field value size (in bytes)                                           | 1MB
`fields` | Taille maximale de la valeur du champ (en octets)                         | Infinity
`fileSize` | Pour les formulaires multipart, la taille maximale du fichier (en octets) | Infinity
`files` | Pour les formulaires multipart, le nombre maximal de champs de fichier    | Infinity
`parts` | Pour les formulaires multipart, le nombre max de parties (champs + fichiers)         | Infinity
`headerPairs` | Pour les formulaires multipart, le nombre maximum de paires clé=>valeur d'en-tête à analyser   | 2000

Spécifier les limites peut aider à protéger votre site contre les attaques par déni de service (DoS).

### `fileFilter`

Définissez ceci sur une fonction pour contrôler quels fichiers doivent être téléchargés et lesquels
devrait être ignoré. La fonction devrait ressembler à ceci:

```javascript
function fileFilter (req, file, cb) {

  // La fonction doit appeler `cb` avec un booléen
  // pour indiquer si le fichier doit être accepté

  // Pour rejeter ce fichier, passez `false`, comme ceci:
  cb(null, false)

  // Pour accepter le fichier, passez `true`, comme ceci:
  cb(null, true)

  // Vous pouvez toujours passer une erreur si quelque chose ne va pas:
  cb(new Error('I don\'t have a clue!'))

}
```

## Gestion des Erreurs

En cas d'erreur, Multer déléguera l'erreur à Express. Vous pouvez
afficher une belle page d'erreur en utilisant [la voie express standard](http://expressjs.com/guide/error-handling.html).

Si vous souhaitez détecter les erreurs spécifiquement de Multer, vous pouvez appeler la
fonction middleware par vous-même. Aussi, si vous voulez attraper seulement [les erreurs Multer](https://github.com/expressjs/multer/blob/master/lib/multer-error.js), vous pouvez utiliser la classe `MulterError` qui est jointe à l'objet `multer` lui-même (par exemple `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Une erreur Multer s'est produite lors du téléchargement.
    } else if (err) {
      // Une erreur inconnue s'est produite lors du téléchargement.
    }

    // Tout s'est bien passé.
  })
})
```

## Moteur de stockage personnalisé

Pour plus d'informations sur la création de votre propre moteur de stockage, consultez [Multer Storage Engine](https://github.com/expressjs/multer/blob/master/StorageEngine.md).

## License

[MIT](LICENSE)
