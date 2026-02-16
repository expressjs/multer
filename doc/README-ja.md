# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multerは、主にファイルアップロードに使用される`multipart/form-data`を処理するためのnode.jsミドルウェアです。効率を最大にするために[busboy](https://github.com/mscdex/busboy)上に構築されています。

**注意**: Multerはmultipart（`multipart/form-data`）ではないフォームは処理しません。

## 翻訳

このREADMEは他の言語でも利用できます：

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | アラビア語      |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | 中国語          |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | フランス語      |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | 韓国語          |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | ポルトガル語 (BR) |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | ロシア語        |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | スペイン語      |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | ウズベク語      |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | ベトナム語      |

## インストール

```sh
$ npm install multer
```

## 使用方法

Multerは`request`オブジェクトに`body`オブジェクトと`file`または`files`オブジェクトを追加します。`body`オブジェクトにはフォームのテキストフィールドの値が含まれ、`file`または`files`オブジェクトにはフォーム経由でアップロードされたファイルが含まれます。

基本的な使用例：

フォームで`enctype="multipart/form-data"`を忘れないでください。

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
  // req.fileは`avatar`ファイルです
  // req.bodyにはテキストフィールドがあれば、それらが含まれます
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.filesは`photos`ファイルの配列です
  // req.bodyにはテキストフィールドがあれば、それらが含まれます
})

const uploadMiddleware = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', uploadMiddleware, function (req, res, next) {
  // req.filesはオブジェクト（String -> Array）で、fieldnameがキー、値はファイルの配列です
  //
  // 例：
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.bodyにはテキストフィールドがあれば、それらが含まれます
})
```

テキストのみのmultipartフォームを処理する必要がある場合は、`.none()`メソッドを使用してください：

```javascript
const express = require('express')
const app = express()
const multer  = require('multer')
const upload = multer()

app.post('/profile', upload.none(), function (req, res, next) {
  // req.bodyにはテキストフィールドが含まれます
})
```

以下は、HTMLフォームでmulterを使用する方法の例です。`enctype="multipart/form-data"`と`name="uploaded_file"`フィールドに特に注意してください：

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

次に、JavaScriptファイルでファイルとボディの両方にアクセスするために以下の行を追加します。アップロード関数でフォームの`name`フィールドの値を使用することが重要です。これにより、multerがリクエストのどのフィールドでファイルを探すべきかがわかります。HTMLフォームとサーバでこれらのフィールドが同じでない場合、アップロードは失敗します：

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.fileは上記のフォームでのファイル名、ここでは'uploaded_file'です
  // req.bodyにはテキストフィールドがあれば、それらが含まれます
  console.log(req.file, req.body)
});
```

## API

### ファイル情報

各ファイルには以下の情報が含まれます：

キー | 説明 | 備考
--- | --- | ---
`fieldname` | フォームで指定されたフィールド名 |
`originalname` | ユーザーのコンピュータ上のファイル名 |
`encoding` | ファイルのエンコーディングタイプ |
`mimetype` | ファイルのMIMEタイプ |
`size` | ファイルサイズ（バイト） |
`destination` | ファイルが保存されたフォルダ | `DiskStorage`
`filename` | `destination`内のファイル名 | `DiskStorage`
`path` | アップロードされたファイルのフルパス | `DiskStorage`
`buffer` | ファイル全体の`Buffer` | `MemoryStorage`

### `multer(opts)`

Multerはオプションオブジェクトを受け取ります。最も基本的なのは`dest`プロパティで、これはMulterにファイルをどこにアップロードするかを指示します。オプションオブジェクトを省略した場合、ファイルはメモリに保持され、ディスクに書き込まれることはありません。

デフォルトでは、Multerは名前の競合を避けるためにファイル名を変更します。リネーム関数は必要に応じてカスタマイズできます。

以下は、Multerに渡すことができるオプションです。

キー | 説明
--- | ---
`dest` または `storage` | ファイルを保存する場所
`fileFilter` | どのファイルを受け入れるかを制御する関数
`limits` | アップロードデータの制限
`preservePath` | ベース名だけでなく、ファイルのフルパスを保持する

一般的なWebアプリでは、`dest`のみが必要で、以下の例のように設定されます。

```javascript
const upload = multer({ dest: 'uploads/' })
```

アップロードをより詳細に制御したい場合は、`dest`の代わりに`storage`オプションを使用します。Multerには`DiskStorage`と`MemoryStorage`のストレージエンジンが付属しています。サードパーティからより多くのエンジンが利用できます。

#### `.single(fieldname)`

`fieldname`という名前の単一ファイルを受け入れます。単一ファイルは`req.file`に保存されます。

#### `.array(fieldname[, maxCount])`

すべて`fieldname`という名前のファイルの配列を受け入れます。オプションで、`maxCount`を超えるファイルがアップロードされた場合にエラーを出します。ファイルの配列は`req.files`に保存されます。

#### `.fields(fields)`

`fields`で指定されたファイルの混合を受け入れます。ファイルの配列を持つオブジェクトが`req.files`に保存されます。

`fields`は`name`と、オプションで`maxCount`を持つオブジェクトの配列である必要があります。
例：

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

テキストフィールドのみを受け入れます。ファイルアップロードが行われた場合、コード"LIMIT\_UNEXPECTED\_FILE"でエラーが発行されます。

#### `.any()`

送信されるすべてのファイルを受け入れます。ファイルの配列は`req.files`に保存されます。

**警告:** ユーザーがアップロードするファイルを常に処理するようにしてください。悪意のあるユーザーが予期しないルートにファイルをアップロードする可能性があるため、multerをグローバルミドルウェアとして追加しないでください。アップロードされたファイルを処理するルートでのみこの関数を使用してください。

### `storage`

#### `DiskStorage`

ディスクストレージエンジンは、ファイルをディスクに保存する完全な制御を提供します。

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

利用可能なオプションは`destination`と`filename`の2つです。これらは両方とも、ファイルをどこに保存するかを決定する関数です。

`destination`は、アップロードされたファイルをどのフォルダに保存するかを決定するために使用されます。これは`string`として指定することもできます（例：`'/tmp/uploads'`）。`destination`が指定されていない場合、一時ファイル用のオペレーティングシステムのデフォルトディレクトリが使用されます。

**注意:** `destination`を関数として提供する場合、ディレクトリの作成はあなたの責任です。文字列を渡す場合、multerはディレクトリが作成されることを確認します。

`filename`は、フォルダ内でファイルに付ける名前を決定するために使用されます。`filename`が指定されていない場合、各ファイルにはファイル拡張子を含まないランダムな名前が付けられます。

**注意:** Multerはファイル拡張子を追加しません。関数はファイル拡張子を含む完全なファイル名を返す必要があります。

各関数には、決定を支援するためにリクエスト（`req`）とファイルに関する情報（`file`）の両方が渡されます。

`req.body`はまだ完全に入力されていない可能性があることに注意してください。これは、クライアントがフィールドとファイルをサーバーに送信する順序に依存します。

コールバックで使用される呼び出し規約（最初のパラメータとしてnullを渡す必要がある）を理解するには、[Node.js error handling](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)を参照してください。

#### `MemoryStorage`

メモリストレージエンジンは、ファイルを`Buffer`オブジェクトとしてメモリに保存します。オプションはありません。

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

メモリストレージを使用する場合、ファイル情報にはファイル全体を含む`buffer`というフィールドが含まれます。

**警告**: 非常に大きなファイルや、比較的小さなファイルを大量に素早くアップロードすると、メモリストレージを使用している場合にアプリケーションのメモリが不足する可能性があります。

### `limits`

以下のオプションプロパティのサイズ制限を指定するオブジェクト。Multerはこのオブジェクトを直接busboyに渡し、プロパティの詳細は[busboyのページ](https://github.com/mscdex/busboy#busboy-methods)で確認できます。

以下の整数値が利用できます：

キー | 説明 | デフォルト
--- | --- | ---
`fieldNameSize` | 最大フィールド名サイズ | 100バイト
`fieldSize` | 最大フィールド値サイズ（バイト） | 1MB
`fields` | 非ファイルフィールドの最大数 | Infinity
`fileSize` | multipartフォームの場合、最大ファイルサイズ（バイト） | Infinity
`files` | multipartフォームの場合、ファイルフィールドの最大数 | Infinity
`parts` | multipartフォームの場合、パーツの最大数（フィールド + ファイル） | Infinity
`headerPairs` | multipartフォームの場合、解析するヘッダーkey=>valueペアの最大数 | 2000

制限を指定することで、サービス拒否（DoS）攻撃からサイトを保護できます。

### `fileFilter`

どのファイルをアップロードし、どのファイルをスキップするかを制御する関数に設定します。関数は以下のようになります：

```javascript
function fileFilter (req, file, cb) {

  // 関数は、ファイルを受け入れるかどうかを示すブール値で`cb`を呼び出す必要があります

  // このファイルを拒否するには`false`を渡します：
  cb(null, false)

  // ファイルを受け入れるには`true`を渡します：
  cb(null, true)

  // 何か問題が発生した場合は、常にエラーを渡すことができます：
  cb(new Error('I don\'t have a clue!'))

}
```

## エラーハンドリング

エラーが発生した場合、MulterはエラーをExpressに委譲します。[標準的なexpressの方法](http://expressjs.com/guide/error-handling.html)を使用して、適切なエラーページを表示できます。

Multerからのエラーを特別にキャッチしたい場合は、ミドルウェア関数を自分で呼び出すことができます。また、[Multerエラー](https://github.com/expressjs/multer/blob/main/lib/multer-error.js)のみをキャッチしたい場合は、`multer`オブジェクト自体に添付されている`MulterError`クラスを使用できます（例：`err instanceof multer.MulterError`）。

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // アップロード時にMulterエラーが発生しました。
    } else if (err) {
      // アップロード時に不明なエラーが発生しました。
    }

    // すべて正常に完了しました。
  })
})
```

## カスタムストレージエンジン

独自のストレージエンジンを構築する方法については、[Multer Storage Engine](https://github.com/expressjs/multer/blob/main/StorageEngine.md)を参照してください。

## ライセンス

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