# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer é um middleware para Node.js que lida com `multipart/form-data`, usado principalmente para o upload de arquivos. Ele é construído sobre o [busboy](https://github.com/mscdex/busboy) para máxima eficiência.

**ATENÇÃO**: O Multer não processará nenhum formulário que não seja do tipo multipart (`multipart/form-data`).

## Traduções

Este README também está disponível em outros idiomas:

|                                                                                |                |
| ------------------------------------------------------------------------------ | -------------- |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Árabe          |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)      | Chinês         |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)          | Coreano        |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | Espanhol       |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | Francês        |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | Português (BR) |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Russo          |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | Uzbeque        |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | Vietnamita     |

## Instalação

```sh
$ npm install --save multer
```

## Uso

O Multer adiciona um objeto `body` e um objeto `file` ou `files` ao objeto `request`. O objeto `body` contém os valores dos campos de texto do formulário, enquanto o objeto `file` ou `files` contém os arquivos que foram enviados pelo formulário.

Exemplo de uso básico:

Não se esqueça do `enctype="multipart/form-data"` em seu formulário.

```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" />
</form>
```

```javascript
const express = require('express')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const app = express()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file é o arquivo `avatar`
  // req.body conterá os campos de texto, se houver algum
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files é um array com os arquivos do campo `photos`
  // req.body conterá os campos de texto, se houver algum
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files é um objeto (String -> Array) onde o nome do campo (fieldname) é a chave, e o valor é um array de arquivos
  //
  // ex:
  //  req.files['avatar'][0] -> Arquivo
  //  req.files['gallery'] -> Array de arquivos
  //
  // req.body conterá os campos de texto, se houver algum
})
```

Caso você precise lidar com um formulário multipart somente de texto, você deve usar o método `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body contém os campos de texto
})
```

A seguir, um exemplo de como o Multer é usado em um formulário HTML. Preste atenção especial aos campos `enctype="multipart/form-data"` e `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Número de palestrantes" name="nspeakers">
    <input type="submit" value="Obter as estatísticas!" class="btn btn-default">
  </div>
</form>
```

Em seguida, no seu arquivo JavaScript, você adicionaria estas linhas para acessar tanto o arquivo quanto o corpo da requisição (`req.body`). É importante que você use o valor do campo `name` do formulário em sua função de upload. Isso informa ao Multer em qual campo da requisição ele deve procurar pelos arquivos. Se esses nomes de campo não forem os mesmos no formulário HTML e no seu servidor, o upload falhará:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file corresponde ao nome do seu arquivo no formulário acima, aqui 'uploaded_file'
  // req.body conterá os campos de texto, se houver algum
  console.log(req.file, req.body)
});
```

## API

### Informações do Arquivo

Cada arquivo contém as seguintes informações:

| Chave | Descrição                                       | Nota            |
| -------------- | ----------------------------------------------- | --------------- |
| `fieldname`    | Nome do campo especificado no formulário        |                 |
| `originalname` | Nome do arquivo no computador do usuário        |                 |
| `encoding`     | Tipo de codificação do arquivo                  |                 |
| `mimetype`     | Tipo MIME do arquivo                            |                 |
| `size`         | Tamanho do arquivo em bytes                     |                 |
| `destination`  | A pasta na qual o arquivo foi salvo             | `DiskStorage`   |
| `filename`     | O nome do arquivo dentro da pasta `destination` | `DiskStorage`   |
| `path`         | O caminho completo do arquivo que foi enviado   | `DiskStorage`   |
| `buffer`       | Um Buffer com o arquivo completo	               | `MemoryStorage` |

### `multer(opts)`

O Multer aceita um objeto de opções, sendo a propriedade `dest` a mais básica delas, que informa ao Multer onde salvar os arquivos. Caso você omita o objeto de opções, os arquivos serão mantidos na memória e nunca serão escritos em disco.

Por padrão, o Multer renomeia os arquivos para evitar conflitos de nomenclatura. A função de renomeação pode ser personalizada de acordo com suas necessidades.

As seguintes opções podem ser passadas para o Multer:

| Chave               | Descrição                                                           |
| ------------------- | ------------------------------------------------------------------- |
| `dest` ou `storage` | Onde armazenar os arquivos                                          |
| `fileFilter`        | Função para controlar quais arquivos são aceitos                    |
| `limits`            | Limites dos dados enviados                                          |
| `preservePath`      | Mantém o caminho completo dos arquivos em vez de apenas o nome base |

Em uma aplicação web comum, geralmente apenas a opção `dest` é necessária, e pode ser configurada como mostrado no exemplo a seguir.

```javascript
const upload = multer({ dest: 'uploads/' })
```

Se você quiser mais controle sobre seus uploads, você deve utilizar a opção `storage` em vez de `dest`. O Multer é distribuído com os mecanismos de armazenamento (_storage engines_) `DiskStorage` e `MemoryStorage`. Mecanismos adicionais estão disponíveis através de terceiros.

#### `.single(fieldname)`

Aceita um único arquivo associado ao nome de campo (`fieldname`). O arquivo será armazenado em `req.file`.

#### `.array(fieldname[, maxCount])`

Aceita um array de arquivos, todos com o mesmo nome de campo (`fieldname`). Opcionalmente, gera um erro se mais de `maxCount` arquivos forem enviados. O array de arquivos será armazenado em `req.files`.

#### `.fields(fields)`

Aceita múltiplos arquivos de campos diferentes, especificados em `fields`. Um objeto contendo arrays de arquivos será armazenado em `req.files`.

`fields` deve ser um array de objetos, cada um com uma propriedade `name` e, opcionalmente, `maxCount`. Exemplo:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Aceita apenas campos de texto. Se um arquivo for enviado, um erro com o código `LIMIT_UNEXPECTED_FILE` será emitido.

#### `.any()`

Aceita todos os arquivos que forem enviados na requisição. Um array de arquivos será armazenado em `req.files`.

**ATENÇÃO:** Certifique-se de sempre tratar os arquivos que um usuário envia. Nunca adicione o Multer como um middleware global, pois um usuário mal-intencionado poderia enviar arquivos para uma rota que você não previu. Use esta função apenas nas rotas onde você está de fato tratando os arquivos enviados.

### `storage`

#### `DiskStorage`

O mecanismo de armazenamento em disco (`DiskStorage`) oferece controle total sobre o armazenamento de arquivos em disco.

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

Existem duas opções disponíveis: `destination` e `filename`. Ambas são **funções** que determinam onde e como o arquivo deve ser armazenado.

`destination` é usada para determinar em qual pasta os arquivos enviados devem ser armazenados. No exemplo, a função simplesmente direciona todos os uploads para a pasta `/tmp/my-uploads`. Alternativamente, você pode fornecer o caminho como uma `string` (ex: `'/tmp/uploads'`). Se nenhuma `destination` for informada, o diretório padrão do sistema operacional para arquivos temporários será usado.

**Atenção**: Se você usar uma função para `destination`, é sua responsabilidade garantir que o diretório exista. Se usar uma `string`, o Multer criará o diretório para você.

`filename` determina como o arquivo será nomeado dentro da pasta. Se nenhuma `filename` for informada, cada arquivo receberá um nome aleatório sem extensão. 

No exemplo acima, é adotada uma estratégia para garantir um nome de arquivo único: o nome do campo do formulário (`file.fieldname`) é combinado com um sufixo único, gerado a partir do *timestamp* atual (gerado com `Date.now()`) e um número aleatório. O resultado é um nome de arquivo como `avatar-1654116982915-789123456`. 

**Atenção:** O Multer não adiciona extensões de arquivo automaticamente; sua função `filename` deve retornar um nome de arquivo completo, incluindo a extensão.

Ambas as funções recebem a requisição (`req`) e informações sobre o arquivo (`file`) para auxiliar na tomada de decisão.

Note que `req.body` pode ainda não estar totalmente preenchido, pois isso depende da ordem em que o cliente transmite os campos e os arquivos para o servidor.

Para entender a convenção de chamada usada no callback (a necessidade de passar `null` como primeiro parâmetro), consulte [o tratamento de erros no Node.js](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors).

#### `MemoryStorage`

O mecanismo de armazenamento em memória (`MemoryStorage`) armazena os arquivos na memória como objetos `Buffer`. Ele não possui opções.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Ao usar o armazenamento de memória, as informações do arquivo conterão um campo chamado `buffer` que contém o arquivo inteiro.

**ATENÇÃO**: Enviar arquivos muito grandes, ou um grande número de arquivos pequenos muito rapidamente, pode fazer com que sua aplicação fique sem memória ao usar o armazenamento em memória.

### `limits`

Um objeto que especifica os limites de tamanho das seguintes propriedades opcionais. O Multer passa este objeto diretamente para o busboy, e os detalhes das propriedades podem ser encontrados na [página do busboy](https://github.com/mscdex/busboy#busboy-methods).

Os seguintes valores inteiros estão disponíveis:

| Key             | Descrição                                                                                                    | Padrão                |
| --------------- | ------------------------------------------------------------------------------------------------------------ | --------------------- |
| `fieldNameSize` | Tamanho máximo do nome do campo                                                                              | 100 bytes             |
| `fieldSize`     | Tamanho máximo do valor do campo (em bytes)                                                                  | 1MB                   |
| `fields`        | Número máximo de campos que não são arquivos                                                                 | *Infinity* (Infinito) |
| `fileSize`      | Para formulários multipart, o tamanho máximo do arquivo (em bytes)                                           | *Infinity* (Infinito) |
| `files`         | Para formulários multipart, o número máximo de campos de arquivo                                             | *Infinity* (Infinito) |
| `parts`         | Para formulários multipart, o número máximo de partes (campos + arquivos)                                    | *Infinity* (Infinito) |
| `headerPairs`   | Para formulários multipart, o número máximo de pares chave=>valor de cabeçalho (*header*) a serem analisados | 2000                  |

A especificação dos limites pode ajudar a proteger seu site contra ataques de negação de serviço (DoS).

### `fileFilter`

Defina esta opção como uma função para controlar quais arquivos devem ser enviados e quais devem ser ignorados. 

A função deve ter a seguinte estrutura:

```javascript
function fileFilter (req, file, cb) {

  // A função deve chamar `cb` com um booleano para indicar se o arquivo deve ser aceito

  // Para rejeitar este arquivo passe `false`, assim:
  cb(null, false)

  // Para aceitar o arquivo passe `true`, assim:
  cb(null, true)

  // Você sempre pode passar um erro se algo der errado:
  cb(new Error('Eu não sei o que houve!'))

}
```

## Tratamento de Erros

Ao encontrar um erro, o Multer delegará o erro para o Express. Você pode exibir uma página de erro personalizada usando [a forma padrão do Express](http://expressjs.com/guide/error-handling.html).

Se você quiser capturar erros específicos do Multer, você pode chamar a função do middleware por conta própria. Além disso, se você quiser capturar apenas [os erros do Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js), pode usar a classe `MulterError`, que está anexada ao próprio objeto `multer` (ex: `err instanceof multer.MulterError`).

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Ocorreu um erro do Multer durante o upload.
    } else if (err) {
      // Ocorreu um erro desconhecido durante o upload.
    }

    // Tudo correu bem.
  })
})
```

## Mecanismo de Armazenamento Personalizado

Para informações sobre como construir seu próprio mecanismo de armazenamento, consulte [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md).

## Licença

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
