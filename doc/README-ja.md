# Multer [![NPM Version][npm-version-image]][npm-url] [![NPM Downloads][npm-downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Test Coverage][test-image]][test-url] [![OpenSSF Scorecard Badge][ossf-scorecard-badge]][ossf-scorecard-visualizer]

Multerは、主にファイルアップロードに使用される`multipart/form-data`を処理するためのnode.jsミドルウェアです。効率を最大にするために[busboy](https://github.com/mscdex/busboy)の上に構築されています。

**注意**: Multerはmultipart（`multipart/form-data`）ではないフォームは処理しません。

## 翻訳

このREADMEは他の言語でも利用できます：

|                                                                                |                 |
| ------------------------------------------------------------------------------ | --------------- |
| [English](https://github.com/expressjs/multer/blob/main/README.md)             | 英語            |
| [العربية](https://github.com/expressjs/multer/blob/main/doc/README-ar.md)      | アラビア語      |
| [简体中文](https://github.com/expressjs/multer/blob/main/doc/README-zh-cn.md)  | 中国語（簡体字） |
| [Français](https://github.com/expressjs/multer/blob/main/doc/README-fr.md)     | フランス語      |
| [Bahasa Indonesia](https://github.com/expressjs/multer/blob/main/doc/README-id.md) | インドネシア語 |
| [한국어](https://github.com/expressjs/multer/blob/main/doc/README-ko.md)       | 韓国語          |
| [Português](https://github.com/expressjs/multer/blob/main/doc/README-pt-br.md) | ポルトガル語（ブラジル） |
| [Русский язык](https://github.com/expressjs/multer/blob/main/doc/README-ru.md) | ロシア語        |
| [Español](https://github.com/expressjs/multer/blob/main/doc/README-es.md)      | スペイン語      |
| [தமிழ்](https://github.com/expressjs/multer/blob/main/doc/README-ta.md)         | タミル語        |
| [O'zbek tili](https://github.com/expressjs/multer/blob/main/doc/README-uz.md)  | ウズベク語      |
| [Việt Nam](https://github.com/expressjs/multer/blob/main/doc/README-vi.md)     | ベトナム語      |
| [Türkçe](https://github.com/expressjs/multer/blob/main/doc/README-tr.md)       | トルコ語        |


## インストール

```sh
$ npm install multer
```

## 使用方法

Multerは`request`オブジェクトに`body`オブジェクトと、`file`または`files`オブジェクトを追加します。`body`オブジェクトにはフォームのテキストフィールドの値が含まれ、`file`または`files`オブジェクトにはフォーム経由でアップロードされたファイルが含まれます。

基本的な使用例：

フォームに`enctype="multipart/form-data"`を付けるのを忘れないでください。

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

以下は、HTMLフォームでmulterを使用する方法の例です。`enctype="multipart/form-data"`と`name="uploaded_file"`のフィールドに特に注意してください：

```html
<form action="/stats" enctype="multipart/form-data" method="post">
  <div class="form-group">
    <input type="file" class="form-control-file" name="uploaded_file">
    <input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">
    <input type="submit" value="Get me the stats!" class="btn btn-default">
  </div>
</form>
```

次に、JavaScriptファイルに以下の行を追加して、ファイルとボディの両方にアクセスします。アップロード関数では、フォームの`name`フィールドの値を使用することが重要です。これによって、multerはリクエストのどのフィールドからファイルを探すべきかを知ります。HTMLフォームとサーバー側でこれらのフィールドが一致していない場合、アップロードは失敗します：

```javascript
const multer  = require('multer')
const upload = multer({ dest: './public/data/uploads/' })
app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.fileは上記フォームでのファイルの名前で、ここでは'uploaded_file'です
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
`originalname` | ユーザーのコンピュータ上でのファイル名。`preservePath: true`の場合はフルパス |
`encoding` | ファイルのエンコーディングタイプ |
`mimetype` | ファイルのMIMEタイプ |
`size` | ファイルサイズ（バイト） |
`destination` | ファイルが保存されたフォルダ | `DiskStorage`
`filename` | `destination`内でのファイル名 | `DiskStorage`
`path` | アップロードされたファイルのフルパス | `DiskStorage`
`buffer` | ファイル全体の`Buffer` | `MemoryStorage`

### `multer(opts)`

Multerはオプションオブジェクトを受け取ります。最も基本的なものは`dest`プロパティで、Multerにファイルをどこにアップロードするかを指示します。オプションオブジェクトを省略した場合、ファイルはメモリに保持され、ディスクに書き込まれることはありません。

デフォルトでは、Multerは名前の衝突を避けるためにファイル名を変更します。このリネーム関数は必要に応じてカスタマイズできます。

以下は、Multerに渡すことができるオプションです。

キー | 説明
--- | ---
`dest` または `storage` | ファイルを保存する場所
`fileFilter` | どのファイルを受け入れるかを制御する関数
`limits` | アップロードされるデータの制限
`preservePath` | `file.originalname`にベース名だけでなく、クライアントから送られたフルパスを保持する
`defParamCharset` | 拡張パラメータ（明示的な文字セットを含むもの）ではないパートヘッダーパラメータの値（例：filename）に使用するデフォルトの文字セット。デフォルト：`'latin1'`

一般的なWebアプリでは`dest`だけが必要で、以下の例のように設定します。

```javascript
const upload = multer({ dest: 'uploads/' })
```

`preservePath`を有効にすると、Multerは受信したファイル名を、クライアントから提供されたパスセグメントを含めたままそのまま渡します。これは`file.originalname`として公開されますが、保存先フォルダを変更したり、ディレクトリを作成したり、パスをサニタイズしたりすることはありません。`file.originalname`は常にクライアントから提供される値であり、信頼できないものとして扱う必要があります。`preservePath`を使用すると、さらにクライアントが送信したパスセグメントも含まれます。カスタムの`filename`やストレージエンジンで使用する前に、正規化または検証してください。

アップロードをより細かく制御したい場合は、`dest`の代わりに`storage`オプションを使用してください。Multerには`DiskStorage`と`MemoryStorage`のストレージエンジンが同梱されています。さらに多くのエンジンがサードパーティから提供されています。

#### `.single(fieldname)`

`fieldname`という名前の単一のファイルを受け入れます。このファイルは`req.file`に格納されます。

#### `.array(fieldname[, maxCount])`

すべて`fieldname`という名前を持つファイルの配列を受け入れます。オプションで、`maxCount`を超える数のファイルがアップロードされた場合にエラーを発生させます。ファイルの配列は`req.files`に格納されます。

#### `.fields(fields)`

`fields`で指定された複数種類のファイルを受け入れます。ファイルの配列を持つオブジェクトが`req.files`に格納されます。

`fields`は、`name`と、オプションで`maxCount`を持つオブジェクトの配列である必要があります。
例：

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

テキストフィールドのみを受け入れます。ファイルのアップロードが行われた場合は、コード"LIMIT\_UNEXPECTED\_FILE"のエラーが発生します。

#### `.any()`

送信されてくるすべてのファイルを受け入れます。ファイルの配列は`req.files`に格納されます。

**警告:** ユーザーがアップロードするファイルを必ず常に処理するようにしてください。悪意のあるユーザーが想定していないルートにファイルをアップロードできてしまうため、multerをグローバルミドルウェアとして追加してはいけません。この関数は、アップロードされたファイルを処理するルートでのみ使用してください。

### `storage`

#### `DiskStorage`

ディスクストレージエンジンを使うと、ファイルのディスクへの保存を完全に制御できます。

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

利用可能なオプションは`destination`と`filename`の2つです。どちらもファイルをどこに保存するかを決定する関数です。

`destination`は、アップロードされたファイルをどのフォルダに保存するかを決定するために使用されます。これは`string`として指定することもできます（例：`'/tmp/uploads'`）。`destination`が指定されていない場合は、オペレーティングシステムのデフォルトの一時ファイル用ディレクトリが使用されます。

**注意:** `destination`を関数として指定する場合、ディレクトリの作成はあなたの責任です。文字列を渡した場合は、multerがディレクトリの作成を保証します。

`filename`は、フォルダ内でファイルにどのような名前を付けるかを決定するために使用されます。`filename`が指定されていない場合、各ファイルにはファイル拡張子を含まないランダムな名前が付けられます。

**注意:** Multerはファイル拡張子を付加しません。関数はファイル拡張子を含む完全なファイル名を返す必要があります。

各関数には、判断の助けとなるように、リクエスト（`req`）とファイルに関する情報（`file`）の両方が渡されます。

`req.body`はまだ完全に埋められていない可能性があることに注意してください。これは、クライアントがフィールドとファイルをサーバーに送信する順序に依存します。

コールバックで使用される呼び出し規約（最初のパラメータとしてnullを渡す必要があること）については、[Node.js error handling](https://web.archive.org/web/20220417042018/https://www.joyent.com/node-js/production/design/errors)を参照してください。

#### `MemoryStorage`

メモリストレージエンジンは、ファイルを`Buffer`オブジェクトとしてメモリに保存します。オプションはありません。

```javascript
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
```

メモリストレージを使用する場合、ファイル情報にはファイル全体を含む`buffer`というフィールドが含まれます。

**警告**: メモリストレージを使用している場合、非常に大きなファイルや、比較的小さなファイルを大量に短時間でアップロードされると、アプリケーションがメモリ不足になる可能性があります。

### `limits`

以下の省略可能なプロパティのサイズ制限を指定するオブジェクトです。Multerはこのオブジェクトをそのままbusboyに渡します。各プロパティの詳細は[busboyのページ](https://github.com/mscdex/busboy#exports)で確認できます。

以下の整数値が利用できます：

キー | 説明 | デフォルト
--- | --- | ---
`fieldNameSize` | フィールド名の最大サイズ | Infinity
`fieldSize` | フィールド値の最大サイズ（バイト） | 1MB
`fields` | ファイル以外のフィールドの最大数 | Infinity
`fileSize` | multipartフォームの場合、ファイルの最大サイズ（バイト） | Infinity
`files` | multipartフォームの場合、ファイルフィールドの最大数 | Infinity
`parts` | multipartフォームの場合、パートの最大数（フィールド + ファイル） | Infinity
`headerPairs` | multipartフォームの場合、解析するヘッダーのkey=>valueペアの最大数 | 2000
`fieldNestingDepth` | フィールド名のネストの最大階層数（例：`a[b][c]`は2階層） | Infinity
`fieldArrayIndexLimit` | フィールド名の中で受け入れる配列インデックスの最大値（例：`a[3]`はインデックス3を使用） | Infinity

`parts`の制限は、設定したパート数を超えたときではなく、busboyが設定したパート数に達した時点で発動します。フィールドとファイルをちょうど特定の数だけ許可したい場合は、`parts`をその合計より少なくとも1大きい値に設定してください。

制限を指定することで、サービス拒否（DoS）攻撃からサイトを保護するのに役立ちます。

### `fileFilter`

どのファイルをアップロードし、どのファイルをスキップするかを制御する関数を設定します。関数は以下のような形になります：

```javascript
function fileFilter (req, file, cb) {

  // この関数は、ファイルを受け入れるかどうかを示す
  // ブール値を渡して`cb`を呼び出す必要があります

  // このファイルを拒否するには、次のように`false`を渡します：
  cb(null, false)

  // ファイルを受け入れるには、次のように`true`を渡します：
  cb(null, true)

  // 何か問題が発生した場合は、いつでもエラーを渡すことができます：
  cb(new Error('I don\'t have a clue!'))

}
```

## セキュリティ

[limits](#limits)を指定することで、サービス拒否（DoS）攻撃からサイトを保護するのに役立ちます。ほとんどのアプリケーションでは、以下の制限を設定することを推奨します：

- `fileSize` -- ユースケースで想定される最大ファイルサイズに設定する
- `files` -- リクエストあたりの最大ファイル数に設定する
- `fields` -- リクエストあたりの最大テキストフィールド数に設定する
- `fieldNestingDepth` -- フィールド名に必要な最小限の階層数に設定する（例：`a[b][c]`の場合は`3`）
- `fieldArrayIndexLimit` -- フィールド名に必要な最大の配列インデックスに設定する（例：`a[99]`の場合は`100`）

## エラーハンドリング

エラーが発生した場合、MulterはエラーをExpressに委譲します。[Expressの標準的な方法](https://expressjs.com/en/guide/error-handling/)を使って、わかりやすいエラーページを表示できます。

Multerからのエラーを個別にキャッチしたい場合は、ミドルウェア関数を自分で呼び出すことができます。また、[Multerのエラー](https://github.com/expressjs/multer/blob/main/lib/multer-error.js)だけをキャッチしたい場合は、`multer`オブジェクト自体に付属している`MulterError`クラスを使用できます（例：`err instanceof multer.MulterError`）。

```javascript
const multer = require('multer')
const upload = multer().single('avatar')

app.post('/profile', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // アップロード時にMulterのエラーが発生しました。
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
