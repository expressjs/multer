# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer est un middleware node.js pour la gestion des données `multipart/form-data`, principalement utilisé pour le téléversement de fichiers. Il est construit
au-dessus de [busboy](https://github.com/mscdex/busboy) pour une efficacité maximale.

**NOTE** : Multer ne traitera aucun formulaire qui n'est pas multipart (`multipart/form-data`).

## Traductions

Ce README est également disponible dans d'autres langues :

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | Anglais         |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Arabe           |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Chinois (simplifié) |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | Japonais        |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | Indonésien  |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | Coréen          |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Portugais (Brésil) |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Russe           |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | Espagnol        |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | Tamoul          |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | Ouzbek          |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | Vietnamien      |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | Turc            |


## Installation

```sh
$ npm install multer
```

## Utilisation

Multer ajoute un objet `body` et un objet `file` ou `files` à l'objet `request`. L'objet `body` contient les valeurs des champs texte du formulaire, l'objet `file` ou `files` contient les fichiers téléversés via le formulaire.

Exemple d'utilisation de base :

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
  // req.body contiendra les champs texte, s'il y en a
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files est un tableau de fichiers `photos`
  // req.body contiendra les champs texte, s'il y en a
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files est un objet (String -> Array) où fieldname est la clé et la valeur un tableau de fichiers
  //
  // par ex.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body contiendra les champs texte, s'il y en a
})
```

Si vous devez traiter un formulaire multipart ne contenant que du texte, utilisez la méthode `.none()` :

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body contient les champs texte
})
```

Voici un exemple d'utilisation de multer dans un formulaire HTML. Faites particulièrement attention aux champs `enctype="multipart/form-data"` et `name="uploaded_file"` :

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Ensuite, dans votre fichier javascript, vous ajouterez ces lignes pour accéder à la fois au fichier et au corps de la requête. Il est important d'utiliser la valeur du champ `name` du formulaire dans votre fonction de téléversement. C'est ce qui indique à multer dans quel champ de la requête il doit chercher les fichiers. Si ces champs ne sont pas identiques dans le formulaire HTML et sur votre serveur, votre téléversement échouera :

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file est le nom de votre fichier dans le formulaire ci-dessus, ici 'uploaded_file'
  // req.body contiendra les champs texte, s'il y en a
  console.log(req.file, req.body)
});
```



## API

### Informations sur les fichiers

Chaque fichier contient les informations suivantes :

Clé | Description | Note
--- | --- | ---
`fieldname` | Nom du champ spécifié dans le formulaire |
`originalname` | Nom du fichier sur l'ordinateur de l'utilisateur, ou le chemin complet lorsque `preservePath: true` |
`encoding` | Type d'encodage du fichier |
`mimetype` | Type MIME du fichier |
`size` | Taille du fichier en octets |
`destination` | Le dossier dans lequel le fichier a été enregistré | `DiskStorage`
`filename` | Le nom du fichier dans la `destination` | `DiskStorage`
`path` | Le chemin complet du fichier téléversé | `DiskStorage`
`buffer` | Un `Buffer` contenant le fichier entier | `MemoryStorage`

### `multer(opts)`

Multer accepte un objet d'options, dont la plus basique est la propriété
`dest`, qui indique à Multer où enregistrer les fichiers. Si vous omettez l'objet
d'options, les fichiers seront conservés en mémoire et ne seront jamais écrits sur le disque.

Par défaut, Multer renomme les fichiers afin d'éviter les conflits de noms. La
fonction de renommage peut être personnalisée selon vos besoins.

Voici les options qui peuvent être passées à Multer.

Clé | Description
--- | ---
`dest` ou `storage` | Où stocker les fichiers
`fileFilter` | Fonction permettant de contrôler quels fichiers sont acceptés
`limits` | Limites des données téléversées
`preservePath` | Conserver le chemin complet fourni par le client dans `file.originalname` au lieu du seul nom de base
`defParamCharset` | Jeu de caractères par défaut à utiliser pour les valeurs des paramètres d'en-tête de partie (par exemple filename) qui ne sont pas des paramètres étendus (c'est-à-dire qui contiennent un jeu de caractères explicite). Par défaut : `'latin1'`

Dans une application web classique, seul `dest` est généralement nécessaire, configuré comme dans
l'exemple suivant.

```javascript
const upload = multer({ dest: 'uploads/' })
```

Lorsque `preservePath` est activé, Multer transmet le nom de fichier reçu tel quel, avec
tous les segments de chemin fournis par le client. Il est exposé via `file.originalname` ;
cela ne modifie pas le dossier de destination, ne crée aucun répertoire et n'assainit pas le
chemin pour vous. `file.originalname` est toujours fourni par le client et doit être considéré
comme non fiable ; avec `preservePath`, il contient en plus les segments de chemin envoyés par le
client. Normalisez-le ou validez-le avant de l'utiliser dans une fonction `filename` personnalisée ou
dans un moteur de stockage.

Si vous souhaitez plus de contrôle sur vos téléversements, utilisez l'option `storage`
plutôt que `dest`. Multer est livré avec les moteurs de stockage `DiskStorage`
et `MemoryStorage` ; d'autres moteurs sont disponibles auprès de tiers.

#### `.single(fieldname)`

Accepte un seul fichier portant le nom `fieldname`. Ce fichier unique sera stocké
dans `req.file`.

#### `.array(fieldname[, maxCount])`

Accepte un tableau de fichiers, tous portant le nom `fieldname`. Renvoie éventuellement une erreur si
plus de `maxCount` fichiers sont téléversés. Le tableau de fichiers sera stocké dans
`req.files`.

#### `.fields(fields)`

Accepte un mélange de fichiers, spécifié par `fields`. Un objet contenant des tableaux de fichiers
sera stocké dans `req.files`.

`fields` doit être un tableau d'objets avec un `name` et éventuellement un `maxCount`.
Exemple :

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

N'accepte que les champs texte. Si un fichier est téléversé, une erreur portant le code
"LIMIT\_UNEXPECTED\_FILE" sera émise.

#### `.any()`

Accepte tous les fichiers reçus. Un tableau de fichiers sera stocké dans
`req.files`.

**ATTENTION :** Assurez-vous de toujours traiter les fichiers qu'un utilisateur téléverse.
N'ajoutez jamais multer comme middleware global, car un utilisateur malveillant pourrait téléverser
des fichiers vers une route que vous n'aviez pas prévue. N'utilisez cette fonction que sur les routes
où vous traitez les fichiers téléversés.

### `storage`

#### `DiskStorage`

Le moteur de stockage sur disque vous donne un contrôle total sur l'enregistrement des fichiers sur le disque.

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

Deux options sont disponibles, `destination` et `filename`. Ce sont toutes deux
des fonctions qui déterminent où le fichier doit être stocké.

`destination` sert à déterminer dans quel dossier les fichiers téléversés doivent
être stockés. Elle peut également être fournie sous forme de `string` (par exemple `'/tmp/uploads'`). Si aucune
`destination` n'est fournie, le répertoire par défaut du système d'exploitation pour les fichiers
temporaires est utilisé.

**Remarque :** Vous êtes responsable de la création du répertoire lorsque vous fournissez
`destination` sous forme de fonction. Lorsque vous passez une chaîne, multer s'assure que
le répertoire est créé pour vous.

`filename` sert à déterminer le nom que doit porter le fichier dans le dossier.
Si aucun `filename` n'est fourni, chaque fichier recevra un nom aléatoire sans
aucune extension de fichier.

**Remarque :** Multer n'ajoutera aucune extension de fichier pour vous ; votre fonction
doit renvoyer un nom de fichier complet, extension comprise.

Chaque fonction reçoit à la fois la requête (`req`) et des informations sur
le fichier (`file`) pour l'aider à prendre sa décision.

Notez que `req.body` n'est peut-être pas encore entièrement rempli. Cela dépend de
l'ordre dans lequel le client transmet les champs et les fichiers au serveur.

Pour comprendre la convention d'appel utilisée dans le callback (la nécessité de passer
null comme premier paramètre), reportez-vous à
[Node.js error handling](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

Le moteur de stockage en mémoire stocke les fichiers en mémoire sous forme d'objets `Buffer`. Il
n'a aucune option.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Lorsque le stockage en mémoire est utilisé, les informations du fichier contiennent un champ nommé
`buffer` qui contient le fichier entier.

**ATTENTION** : Le téléversement de fichiers très volumineux, ou de fichiers relativement petits en grand
nombre et très rapidement, peut provoquer un dépassement de la mémoire disponible de votre application lorsque
le stockage en mémoire est utilisé.

### `limits`

Un objet spécifiant les limites de taille des propriétés optionnelles suivantes. Multer transmet cet objet directement à busboy, et le détail des propriétés est disponible sur [la page de busboy](https://github.com/mscdex/busboy#exports).

Les valeurs entières suivantes sont disponibles :

Clé | Description | Par défaut
--- | --- | ---
`fieldNameSize` | Taille maximale du nom de champ | Infinity
`fieldSize` | Taille maximale de la valeur d'un champ (en octets) | 1MB
`fields` | Nombre maximal de champs non-fichier | Infinity
`fileSize` | Pour les formulaires multipart, la taille maximale d'un fichier (en octets) | Infinity
`files` | Pour les formulaires multipart, le nombre maximal de champs de type fichier | Infinity
`parts` | Pour les formulaires multipart, le nombre maximal de parties (champs + fichiers) | Infinity
`headerPairs` | Pour les formulaires multipart, le nombre maximal de paires clé=>valeur d'en-tête à analyser | 2000
`fieldNestingDepth` | Nombre maximal de niveaux d'imbrication dans les noms de champ (par exemple `a[b][c]` a 2 niveaux) | Infinity
`fieldArrayIndexLimit` | Index numérique de tableau maximal accepté dans un nom de champ (par exemple `a[3]` utilise l'index 3) | Infinity

La limite `parts` se déclenche dès que busboy atteint le nombre de parties
configuré, et pas seulement lorsque ce nombre est dépassé. Si vous souhaitez autoriser un nombre
exact de champs et de fichiers, définissez `parts` à au moins ce total plus un.

Spécifier les limites peut aider à protéger votre site contre les attaques par déni de service (DoS).

### `fileFilter`

Définissez cette option sur une fonction pour contrôler quels fichiers doivent être téléversés et lesquels
doivent être ignorés. La fonction doit ressembler à ceci :

```javascript
function fileFilter (req, file, cb) {

  // La fonction doit appeler `cb` avec un booléen
  // pour indiquer si le fichier doit être accepté

  // Pour rejeter ce fichier, passez `false`, comme ceci :
  cb(null, false)

  // Pour accepter le fichier, passez `true`, comme ceci :
  cb(null, true)

  // Vous pouvez toujours passer une erreur si quelque chose ne va pas :
  cb(new Error('I don\'t have a clue!'))

}
```

## Sécurité

Spécifier les [limites](#limits) peut aider à protéger votre site contre les attaques par déni de service (DoS). Les limites suivantes sont recommandées pour la plupart des applications :

- `fileSize` -- à définir sur la taille de fichier maximale attendue pour votre cas d'usage
- `files` -- à définir sur le nombre maximal de fichiers par requête
- `fields` -- à définir sur le nombre maximal de champs texte par requête
- `fieldNestingDepth` -- à définir sur la profondeur minimale requise par vos noms de champ (par exemple `3` pour `a[b][c]`)
- `fieldArrayIndexLimit` -- à définir sur le plus grand index de tableau requis par vos noms de champ (par exemple `100` pour `a[99]`)

## Gestion des erreurs

Lorsqu'une erreur survient, Multer la délègue à Express. Vous pouvez
afficher une page d'erreur soignée en utilisant [la méthode standard d'Express](https://expressjs.com/en/guide/error-handling/).

Si vous souhaitez intercepter spécifiquement les erreurs de Multer, vous pouvez appeler la
fonction middleware vous-même. De plus, si vous ne voulez intercepter que [les erreurs Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js), vous pouvez utiliser la classe `MulterError` attachée à l'objet `multer` lui-même (par exemple `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Une erreur Multer s'est produite lors du téléversement.
    } else if (err) {
      // Une erreur inconnue s'est produite lors du téléversement.
    }

    // Tout s'est bien passé.
  })
})
```

## Moteur de stockage personnalisé

Pour savoir comment créer votre propre moteur de stockage, consultez [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md).

## Licence

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
