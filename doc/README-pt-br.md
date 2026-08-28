# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multer é um middleware para node.js que lida com `multipart/form-data`, usado principalmente para upload de arquivos. Ele é escrito
sobre o [busboy](https://github.com/mscdex/busboy) para obter a máxima eficiência.

**NOTA**: O Multer não processará nenhum formulário que não seja multipart (`multipart/form-data`).

## Traduções

Este README também está disponível em outros idiomas:

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)            | Inglês          |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | Árabe           |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | Chinês (Simplificado) |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | Francês         |
| [日本語](https://github.com/expressjs/multer/blob/main/doc/README-ja.md)       | Japonês         |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | Indonésio     |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | Coreano         |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | Russo           |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | Espanhol        |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | Tâmil           |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | Uzbeque         |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | Vietnamita      |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | Turco           |


## Instalação

```sh
$ npm install multer
```

## Uso

O Multer adiciona um objeto `body` e um objeto `file` ou `files` ao objeto `request`. O objeto `body` contém os valores dos campos de texto do formulário, e o objeto `file` ou `files` contém os arquivos enviados por meio do formulário.

Exemplo de uso básico:

Não se esqueça do `enctype="multipart/form-data"` no seu formulário.

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
  // req.file é o arquivo `avatar`
  // req.body conterá os campos de texto, se houver
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files é um array de arquivos `photos`
  // req.body conterá os campos de texto, se houver
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.files é um objeto (String -> Array) em que fieldname é a chave e o valor é um array de arquivos
  //
  // ex.:
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body conterá os campos de texto, se houver
})
```

Caso você precise lidar com um formulário multipart que contenha apenas texto, use o método `.none()`:

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.body contém os campos de texto
})
```

Aqui está um exemplo de como o multer é usado em um formulário HTML. Preste atenção especial aos campos `enctype="multipart/form-data"` e `name="uploaded_file"`:

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

Em seguida, no seu arquivo javascript, você adicionaria estas linhas para acessar tanto o arquivo quanto o body. É importante que você use o valor do campo `name` do formulário na sua função de upload. Isso informa ao multer em qual campo da requisição ele deve procurar os arquivos. Se esses campos não forem iguais no formulário HTML e no seu servidor, o upload falhará:

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file é o nome do seu arquivo no formulário acima, aqui 'uploaded_file'
  // req.body conterá os campos de texto, se houver
  console.log(req.file, req.body)
});
```



## API

### Informações do arquivo

Cada arquivo contém as seguintes informações:

Chave | Descrição | Observação
--- | --- | ---
`fieldname` | Nome do campo especificado no formulário |
`originalname` | Nome do arquivo no computador do usuário, ou o caminho completo quando `preservePath: true` |
`encoding` | Tipo de codificação do arquivo |
`mimetype` | Tipo MIME do arquivo |
`size` | Tamanho do arquivo em bytes |
`destination` | A pasta na qual o arquivo foi salvo | `DiskStorage`
`filename` | O nome do arquivo dentro de `destination` | `DiskStorage`
`path` | O caminho completo do arquivo enviado | `DiskStorage`
`buffer` | Um `Buffer` com o arquivo inteiro | `MemoryStorage`

### `multer(opts)`

O Multer aceita um objeto de opções, cuja propriedade mais básica é `dest`,
que informa ao Multer onde salvar os arquivos. Caso você omita o objeto de
opções, os arquivos serão mantidos em memória e nunca gravados em disco.

Por padrão, o Multer renomeia os arquivos para evitar conflitos de nomes. A
função de renomeação pode ser personalizada de acordo com as suas necessidades.

A seguir estão as opções que podem ser passadas ao Multer.

Chave | Descrição
--- | ---
`dest` ou `storage` | Onde armazenar os arquivos
`fileFilter` | Função para controlar quais arquivos são aceitos
`limits` | Limites dos dados enviados
`preservePath` | Mantém o caminho completo fornecido pelo cliente em `file.originalname` em vez de apenas o nome base
`defParamCharset` | Conjunto de caracteres padrão a ser usado nos valores dos parâmetros de cabeçalho de cada parte (por exemplo, filename) que não sejam parâmetros estendidos (que contêm um charset explícito). Padrão: `'latin1'`

Em uma aplicação web comum, talvez apenas `dest` seja necessário, configurado como mostrado
no exemplo a seguir.

```javascript
const upload = multer({ dest: 'uploads/' })
```

Quando `preservePath` está habilitado, o Multer repassa o nome do arquivo recebido com
todos os segmentos de caminho fornecidos pelo cliente. Isso é exposto como `file.originalname`;
ele não altera a pasta de destino, não cria diretórios nem sanitiza o
caminho para você. `file.originalname` é sempre fornecido pelo cliente e deve ser tratado
como não confiável; com `preservePath`, ele contém adicionalmente os segmentos de caminho que o
cliente enviou. Normalize ou valide esse valor antes de usá-lo em um `filename` personalizado ou
em um mecanismo de armazenamento.

Se você quiser mais controle sobre os seus uploads, use a opção `storage`
em vez de `dest`. O Multer vem com os mecanismos de armazenamento `DiskStorage`
e `MemoryStorage`; outros mecanismos estão disponíveis por meio de terceiros.

#### `.single(fieldname)`

Aceita um único arquivo com o nome `fieldname`. Esse arquivo será armazenado
em `req.file`.

#### `.array(fieldname[, maxCount])`

Aceita um array de arquivos, todos com o nome `fieldname`. Opcionalmente, gera um erro se
mais de `maxCount` arquivos forem enviados. O array de arquivos será armazenado em
`req.files`.

#### `.fields(fields)`

Aceita uma combinação de arquivos, especificada por `fields`. Um objeto com arrays de arquivos
será armazenado em `req.files`.

`fields` deve ser um array de objetos com `name` e, opcionalmente, um `maxCount`.
Exemplo:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Aceita apenas campos de texto. Se algum upload de arquivo for feito, um erro com o código
"LIMIT\_UNEXPECTED\_FILE" será emitido.

#### `.any()`

Aceita todos os arquivos que chegarem pela conexão. Um array de arquivos será armazenado em
`req.files`.

**AVISO:** Certifique-se de sempre tratar os arquivos que um usuário envia.
Nunca adicione o multer como um middleware global, pois um usuário mal-intencionado poderia enviar
arquivos para uma rota que você não previu. Use esta função apenas nas rotas
em que você está tratando os arquivos enviados.

### `storage`

#### `DiskStorage`

O mecanismo de armazenamento em disco oferece controle total sobre a gravação de arquivos em disco.

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

Há duas opções disponíveis, `destination` e `filename`. Ambas são
funções que determinam onde o arquivo deve ser armazenado.

`destination` é usada para determinar em qual pasta os arquivos enviados devem
ser armazenados. Ela também pode ser informada como uma `string` (por exemplo, `'/tmp/uploads'`). Se nenhum
`destination` for informado, o diretório padrão do sistema operacional para arquivos
temporários é usado.

**Nota:** Você é responsável por criar o diretório ao fornecer
`destination` como uma função. Ao passar uma string, o multer garantirá que
o diretório seja criado para você.

`filename` é usada para determinar qual nome o arquivo deve receber dentro da pasta.
Se nenhum `filename` for informado, cada arquivo receberá um nome aleatório que não
inclui nenhuma extensão de arquivo.

**Nota:** O Multer não acrescentará nenhuma extensão de arquivo para você; sua função
deve retornar um nome de arquivo completo, com a extensão.

Cada função recebe tanto a requisição (`req`) quanto algumas informações sobre
o arquivo (`file`) para ajudar na decisão.

Observe que `req.body` pode ainda não ter sido totalmente preenchido. Isso depende da
ordem em que o cliente transmite os campos e os arquivos ao servidor.

Para entender a convenção de chamada usada no callback (a necessidade de passar
null como primeiro parâmetro), consulte
[Tratamento de erros no Node.js](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)

#### `MemoryStorage`

O mecanismo de armazenamento em memória armazena os arquivos em memória como objetos `Buffer`. Ele
não possui nenhuma opção.

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

Ao usar o armazenamento em memória, as informações do arquivo conterão um campo chamado
`buffer` que contém o arquivo inteiro.

**AVISO**: Fazer upload de arquivos muito grandes, ou de arquivos relativamente pequenos em grande
quantidade e muito rapidamente, pode fazer com que sua aplicação fique sem memória quando o
armazenamento em memória é usado.

### `limits`

Um objeto que especifica os limites de tamanho das seguintes propriedades opcionais. O Multer passa esse objeto diretamente ao busboy, e os detalhes das propriedades podem ser encontrados na [página do busboy](https://github.com/mscdex/busboy#exports).

Os seguintes valores inteiros estão disponíveis:

Chave | Descrição | Padrão
--- | --- | ---
`fieldNameSize` | Tamanho máximo do nome do campo | Infinity
`fieldSize` | Tamanho máximo do valor do campo (em bytes) | 1MB
`fields` | Número máximo de campos que não são arquivos | Infinity
`fileSize` | Para formulários multipart, o tamanho máximo do arquivo (em bytes) | Infinity
`files` | Para formulários multipart, o número máximo de campos de arquivo | Infinity
`parts` | Para formulários multipart, o número máximo de partes (campos + arquivos) | Infinity
`headerPairs` | Para formulários multipart, o número máximo de pares chave=>valor de cabeçalho a serem analisados | 2000
`fieldNestingDepth` | Número máximo de níveis de aninhamento nos nomes dos campos (por exemplo, `a[b][c]` tem 2 níveis) | Infinity
`fieldArrayIndexLimit` | Índice numérico máximo de array aceito dentro de um nome de campo (por exemplo, `a[3]` usa o índice 3) | Infinity

O limite `parts` é acionado quando o busboy atinge o número configurado de
partes, e não apenas depois que esse número é ultrapassado. Se você quiser permitir um número exato
de campos e arquivos, defina `parts` como pelo menos um a mais do que esse total.

Especificar os limites pode ajudar a proteger o seu site contra ataques de negação de serviço (DoS).

### `fileFilter`

Defina esta opção como uma função para controlar quais arquivos devem ser enviados e quais
devem ser ignorados. A função deve ter o seguinte formato:

```javascript
function fileFilter (req, file, cb) {

  // A função deve chamar `cb` com um booleano
  // para indicar se o arquivo deve ser aceito

  // Para rejeitar este arquivo, passe `false`, assim:
  cb(null, false)

  // Para aceitar o arquivo, passe `true`, assim:
  cb(null, true)

  // Você sempre pode passar um erro se algo der errado:
  cb(new Error('I don\'t have a clue!'))

}
```

## Segurança

Especificar os [limits](#limits) pode ajudar a proteger o seu site contra ataques de negação de serviço (DoS). Os seguintes limites são recomendados para a maioria das aplicações:

- `fileSize` -- defina como o tamanho máximo de arquivo esperado para o seu caso de uso
- `files` -- defina como o número máximo de arquivos por requisição
- `fields` -- defina como o número máximo de campos de texto por requisição
- `fieldNestingDepth` -- defina como a profundidade mínima que os nomes dos seus campos exigem (por exemplo, `3` para `a[b][c]`)
- `fieldArrayIndexLimit` -- defina como o maior índice de array que os nomes dos seus campos exigem (por exemplo, `100` para `a[99]`)

## Tratamento de erros

Ao encontrar um erro, o Multer delega o erro ao Express. Você pode
exibir uma página de erro amigável usando [a forma padrão do express](https://expressjs.com/en/guide/error-handling/).

Se você quiser capturar especificamente os erros do Multer, pode chamar a
função de middleware por conta própria. Além disso, se quiser capturar apenas [os erros do Multer](https://github.com/expressjs/multer/blob/main/lib/multer-error.js), você pode usar a classe `MulterError`, que está anexada ao próprio objeto `multer` (por exemplo, `err instanceof multer.MulterError`).

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

## Mecanismo de armazenamento personalizado

Para obter informações sobre como criar o seu próprio mecanismo de armazenamento, consulte [Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md).

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
