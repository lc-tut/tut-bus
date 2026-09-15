# timetable-gen 座標ベース抽出への移行 実装計画

[検証レポート](./ocr-extraction-verification-report.md)で「座標ベース抽出を主軸、異常時のみVLMフォールバック」という方針を決めた。本ドキュメントはその実装計画。

作成日: 2026-09-14
関連Issue: https://github.com/lc-tut/tut-bus/issues/213

---

## 0. スコープと前提

- **既存のGeminiパスは削除しない**。Issue #213でメンバーの合意を取る前なので、座標抽出は**フラグで切り替える追加実装**とし、デフォルトの挙動は変えない
- **LLMフォールバックは骨組み（インターフェース＋発火箇所）のみ**。実際のモデル呼び出しは実装しない・動作させない
- 対象は `apps/api/tools/timetable-gen` のみ。API本体・フロントエンドには触らない

## 1. 事前検証で確定済みの事実（再調査不要）

実装前に以下を実機で検証済み。**同じ轍を踏まないこと**。

### 1.1 Goへの移植は不可能

| ライブラリ | 結果 |
|---|---|
| `rsc.io/pdf` | PDFのパース自体に失敗（`malformed PDF: stream not present`） |
| `github.com/ledongthuc/pdf` | 日本語が**文字化け**（`キャンパス発` → `キャンパス発�`）。さらにX座標が文字送りされず、長い日本語文字列の全文字が同じX座標を返す |
| `unidoc/unipdf` | 商用ライセンス。学生サークルのOSSプロジェクトには不適 |

ヘッダーラベルの文字列マッチが成立しないため、**Go単体での座標抽出は諦めてPythonに出す**。

### 1.2 PDFライブラリは pdfplumber を使う（PyMuPDFではない）

- PyMuPDF（`fitz`）は**AGPL**。このリポジトリはpublicだが**LICENSEファイルが無い**ため、AGPLの感染性を持ち込むのは避ける
- `pdfplumber`（MIT、内部の`pdfminer.six`もMIT）で**同等の結果**を確認済み:
  - 時刻トークンの**テキストは完全一致**、**X座標の差はゼロ**
  - Y座標はPyMuPDF比で**一定の1.46ptオフセット**があるのみ（アルゴリズムは相対比較しか使わないため無害）
  - **学生会館の結合ヘッダー問題が発生しない**。PyMuPDFが`キャンパス発会館発着キャンパス着`と1語で返すのに対し、pdfplumberは`キャンパス発`/`会館発着`/`キャンパス着`の3語に正しく分割する → **プロトタイプにある`MERGED_HEADER`の特殊処理は移植不要**

### 1.3 プロトタイプの所在

検証で使った実装（PyMuPDF版）を読んでから移植すること。アルゴリズムの意図はdocstringに書いてある。

- 抽出: `/tmp/claude-1000/-home-luy869-ES/1d06a955-c86f-4ccd-be31-73c8b0edc89d/scratchpad/ocr_test/geo_extract.py`
- 行の整合性チェック: `/tmp/claude-1000/-home-luy869-ES/1d06a955-c86f-4ccd-be31-73c8b0edc89d/scratchpad/ocr_test/row_validator.py`
- 突き合わせスクリプト: 同ディレクトリの `cross_check_full.py`
- 検証用PDF（12枚）: 同ディレクトリの `pdfs/`
- 本番の正解データ: 同ディレクトリの `prod_json/`

### 1.4 ハマりどころ（プロトタイプで実際に踏んだバグ）

| 罠 | 内容 |
|---|---|
| 表の境界 | 各表の行収集範囲に**Y座標の上限**を設けないと、下にある別表（土曜日ボックス等）まで巻き込む。上限は「同じX範囲を持つ、より下にある次のヘッダーのY」から**動的に**求める。座標のハードコードは禁止 |
| ヘッダー除外の余白 | ヘッダー行を飛ばす余白を大きく取りすぎると（5pt）、ヘッダーと1行目が近いPDF（`260727.pdf`土曜表は間隔4.92pt）で**1行目を丸ごと落とす**。2pt程度に抑える。時刻フォーマットの正規表現が別途効くので、余白が小さくてもヘッダー文字列を誤って拾う心配はない |
| ヘッダーの表記ゆれ | `260803.pdf`だけ中央列が「駅発着」ではなく**「駅着発」**（漢字が逆）。エイリアスとして両方受理する（`会館着発`も同様に用意） |
| 列とY座標の対応 | 同じ視覚的な行でも列ごとにベースラインが微妙にズレる。**Y座標同士をマッチさせず、列ごとにY順ソートしてインデックスで対応付ける** |
| 全角チルダ | シャトル区切り行は全角`～`。半角`~`と混在させない |

## 2. 実装

### 2.1 ディレクトリ構成

```
apps/api/tools/timetable-gen/
  extractor/                 ← 新規
    geo_extract.py           ← 座標ベース抽出（pdfplumber）
    requirements.txt         ← pdfplumber のみ
    README.md                ← 単体での実行方法
  geo_extractor.go           ← 新規: Pythonを叩いて ExtractedData に流し込む
  fallback.go                ← 新規: LLMフォールバックの骨組み（動作させない）
  row_check.go               ← 新規: 行単位の整合性チェック
```

### 2.2 Python側の契約

`geo_extract.py` は **`types.go` の `ExtractedData` と同じJSON** を stdout に出す。これにより `Map()` 以降（マッピング・`Validate()`・書き出し）は**一切改修不要**になる。

```
python3 extractor/geo_extract.py <pdf_path>   →  stdout に ExtractedData のJSON
```

`ExtractedData` の構造は `types.go` を参照。埋める必要があるフィールド:

| フィールド | 取得元 |
|---|---|
| `stationName` | 【八王子みなみ野駅】等の見出しテキスト |
| `dayType` | ≪月～金曜日≫ / ≪土曜日運行≫ 等の見出しから `weekday`/`saturday`/`holiday` |
| `validFrom` / `validTo` | 「４月７日～７月２９日運行」＋「2026年度」から算出 |
| `specificFrom` / `specificTo` | 特定日PDF（「5月23日」等）の場合のみ |
| `segments[].rows` | 3列の時刻。シャトル区切り行は `["～","～","～","<備考テキスト>"]` |
| `segments[].startTime` 等 | シャトル区間。備考欄の「約3〜5分間隔」から `intervalMin`/`intervalMax` |

**PR #197 のルールを必ず維持すること**: 特定日スケジュールで**年が特定できない場合、絶対に憶測で埋めない**（空文字のままにする）。誤った時刻表を利用者に見せる被害の方が重い。

### 2.3 Go側

- `geo_extractor.go`: `ExtractGeo(pdfPath string) (*ExtractedData, error)` を実装。`os/exec` でPythonを呼び、stdoutのJSONを `ExtractedData` にunmarshalする。Pythonの非ゼロ終了・stderrはエラーとして扱う
- `sync.go` / `main.go`: `--extractor` フラグを追加（`gemini`（デフォルト、現状維持） / `geo`）。`generateFromPDF` の中で `Extract()` か `ExtractGeo()` かを切り替えるだけに留め、それ以外のフローは変えない
- **`GEMINI_API_KEY` 必須チェックの扱いに注意**: `--extractor=geo` の時はAPIキー無しで動かせるようにする（現状は無条件で `log.Fatal` する）

### 2.4 行の整合性チェック（`row_check.go`）

`row_validator.py` のロジックをGoに移植する。既存の `Validate()` は**残したまま**、その後段に追加する。

実装する検査:

1. **完全な重複行**の検知 → **エラー**（パイプラインを止める。実データで偽陽性ゼロ）
2. **時系列の逆転**（前の行より出発時刻が早い）の検知 → **エラー**（同上）
3. **列間所要時間の一貫性** → **警告（ログのみ）**。エラーにしてはいけない

> **【訂正 2026-09-14】** 当初この計画は3を主たるエラー検知として指定していたが、**誤りだった**。「固定ルートなので所要時間は一定」という前提は、検証した1枚の表（みなみ野駅平日、82行で例外ゼロ）でしか成立しない。実データ全体では朝一番・最終便などで**最大3分の正当な変動**があり、二峰性の表も存在する。唯一の捏造行の乖離が4分なので判別マージンは1分しかない。実際にエラーとして配線したところ**全PDFが拒否され、指摘行はすべて正当**だった。詳細は[検証レポート8.2節の訂正](./ocr-extraction-verification-report.md#82-採用した案-列間所要時間の一貫性チェック)。

**出発間隔の統計異常チェックは実装しないこと**。実データで検証した結果、正常な行（`12:16→12:30`の14分間隔）を誤検知し、かつ実際の捏造行は見逃すという二重の失敗をした。詳細は[検証レポート8.1節](./ocr-extraction-verification-report.md#81-最初の案出発間隔の統計は不採用)。

**既知の限界**: この方式では**行の「欠落」は検知できない**（不正な行が残らないため）。これは方針として許容済み（最終的に人がチェックする前提）。限界をコメントに明記すること。

### 2.5 LLMフォールバック（`fallback.go`）— 骨組みのみ

**実装しない・動作させない。** インターフェースと発火箇所だけ用意する。

```go
// FallbackExtractor re-processes a PDF when coordinate-based extraction
// reports an anomaly. Not implemented yet - see issue #213.
type FallbackExtractor interface {
    Extract(pdfPath string, reason string) (*ExtractedData, error)
}
```

- 発火条件（＝どこで呼ぶか）だけ配線する: ①Python側が列数不一致を報告した ②表が1つも取れなかった ③`row_check.go` が異常を検知した
- 実体は `errNotImplemented` を返すだけのスタブにする。**Ollama等への接続コードは書かない**
- 呼び出し側は、フォールバックが未実装でも**従来通りログを出して当該PDFをスキップする**挙動を維持すること（フォールバック不在でパイプラインが止まらないように）

## 3. テスト

### 3.1 フィクスチャ

`downloaded/` に既に `260407.pdf` / `260523.pdf` がある。エッジケースを押さえるため以下を `testdata/` に追加する（スクラッチの `pdfs/` からコピー）:

| PDF | 何のケースか |
|---|---|
| `260803.pdf` | ヘッダー表記ゆれ「駅着発」・学生会館の表が無い4表構成 |
| `260727.pdf` | ヘッダーと1行目の間隔が狭い（4.92pt）土曜表 |
| `260928.pdf` | 5表構成の基本形 |

### 3.2 期待値

スクラッチの `prod_json/` にある**本番Gemini抽出データ**を正解として使う。座標抽出は既にこれらと**22表中20表で完全一致**しており、残り2表は座標抽出側が正しいことが確認済み（`260407.pdf`のみなみ野駅`12:06`便・八王子駅南口`9:03`便が本番側で欠落）。

**この2件は「テストが落ちる」のではなく「本番データが間違っている」ケース**なので、期待値側を実PDFに合わせて修正した上でフィクスチャ化すること。

### 3.3 追加するテスト

- `geo_extractor_test.go`: 各フィクスチャPDFについて、抽出結果が期待JSONと一致すること
- `row_check_test.go`: 捏造行・重複行・時系列逆転をそれぞれ検知すること、**正常データで誤検知しないこと**
- 既存の `config_test.go` / `mapper_test.go` / `validator_test.go` は壊さない

## 4. CI

`timetable-gen-ci.yml` にPythonのセットアップを追加する。

- `actions/setup-python` ＋ `pip install -r apps/api/tools/timetable-gen/extractor/requirements.txt`
- 既存のgofmtチェックは `go list` ベースのファイル列挙のまま（PR #201の修正を壊さないこと）
- `timetable-sync.yml` は**このPRでは変更しない**（デフォルトがGeminiのままなので動作は変わらない）

## 5. やらないこと

- Geminiパスの削除（Issue #213の合意待ち）
- `timetable-sync.yml` のデフォルト切り替え
- LLMフォールバックの実処理・モデル呼び出し
- PaddleOCR-VL等の特化型OCRモデルの導入（[検証レポート6章](./ocr-extraction-verification-report.md#6-方式c-paddleocr-vl特化型ocr)参照、不採用）
- API本体・フロントエンドの変更
