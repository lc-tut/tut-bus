# timetable-gen 座標ベース抽出 実装完了報告

[実装計画書](./timetable-gen-geo-extractor-plan.md)に基づく実装が完了した。本ドキュメントは動作テスト・コードレビュー・その結果の対応をまとめたもの。

作成日: 2026-09-15
関連Issue: https://github.com/lc-tut/tut-bus/issues/213
関連ドキュメント: [検証レポート](./ocr-extraction-verification-report.md) / [実装計画書](./timetable-gen-geo-extractor-plan.md)

**コミットは未実施。** 作業ツリーに変更を置いた状態。

---

## 1. 実装物

| ファイル | 内容 |
|---|---|
| `extractor/geo_extract.py`（新規） | pdfplumber（MIT）による座標ベース抽出本体。`ExtractedData`契約のJSONをstdoutに出力 |
| `extractor/requirements.txt`（新規） | `pdfplumber==0.11.9` のみ |
| `geo_extractor.go`（新規） | Pythonをサブプロセス実行し`ExtractedData`にデコード。`extractWithMode()`で`--extractor=gemini/geo`を切替 |
| `fallback.go`（新規） | LLMフォールバックの骨組みのみ。**実処理は書いていない**（後述） |
| `row_check.go`（新規） | 行単位の整合性チェック（重複行・時系列逆転＝エラー、列間所要時間の一貫性＝警告） |
| `main.go` / `sync.go`（変更） | `--extractor`フラグ追加。geo指定時はAPIキー不要 |
| `.github/workflows/timetable-gen-ci.yml`（変更） | Python 3.11セットアップ追加 |
| `testdata/{260803,260727,260928}.pdf`（新規） | エッジケースを押さえたテストフィクスチャ |

既存の`extractor.go`（Gemini経路）・`mapper.go`・`validator.go`・`types.go`は**無変更**。デフォルトの`--extractor gemini`の挙動は変わらない。

## 2. 動作テスト

### 2.1 全12PDFでの一気通貫実行

大学公式サイト掲載の全12PDFに対し、`go run . --pdf <PDF> --extractor=geo`を実行した。

| 結果 | 件数 | 内訳 |
|---|---|---|
| 自動成功 | 10 | 生成ファイル数はPDFあたり6〜12件 |
| 手動`--from/--to`が必要 | 2 | `260912.pdf`・`260627.pdf`。PDF内に「年度」表記が一切無く、年を特定できない |

後者は**新規コードのバグではない**。`mapper.go`（今回無変更）が元々持つ仕様で、PR #197の「年を憶測しない」ルールが正しく機能した結果。既存のGemini経路でも同じPDFで同じ理由により`--from/--to`が必要になる。`--from 2026-09-12 --to 2026-09-12`を付けて実行し、正常に4件生成されることを確認済み。

### 2.2 本番Geminiデータとの突き合わせ（Goパイプライン全体で再実施）

プロトタイプ（Python単体）だけでなく、**Go側の`ExtractGeo→Map→Validate`のパイプライン全体**を通した出力を、本番稼働中のGeminiデータ23ファイルと突き合わせた。

**比較できた21ファイル中21ファイルが完全一致**（未生成2件は[検証レポート5.6節](./ocr-extraction-verification-report.md#56-本番の独立データとの突き合わせ)で既報告済みの`260803.pdf`土曜セクションの解釈差分のみ。後述4章参照）。

### 2.3 ビルド・静的解析・単体テスト

```
gofmt -l .    → 差分なし
go build ./... → 成功
go vet ./...   → 成功
go test ./... -race → 成功
```

## 3. コードレビュー（go-reviewerサブエージェントによる独立レビュー）

総合判定は **Warning**（CRITICAL/セキュリティ上のブロック要因なし）。指摘1件を修正した。

### 3.1 修正した指摘: サブプロセスにタイムアウトが無い【HIGH・修正済み】

`ExtractGeo`が`exec.Command`（`CommandContext`ではない）でPythonを起動しており、`extractWithMode`が持つ`ctx`が配線されていなかった。不正な形式のPDFで`pdfplumber`がハングする等の事態が起きると、`sync`はPDFを順次処理するため**以降の全PDFの処理が無期限に止まる**実害があった。

対応: `exec.CommandContext` に変更し、`ExtractGeo`の引数に`ctx`を追加、呼び出し元の`ctx`をそのまま配線。**30秒のタイムアウト**を設定（`geoExtractTimeout`定数）。タイムアウト発生時は専用のエラーメッセージを返す。既に期限切れのコンテキストを渡すと即座に失敗することを確認する単体テスト（`TestExtractGeo_RespectsContextDeadline`）を追加した。

### 3.2 修正した指摘: テストが実質何も検証していない【MEDIUM・修正済み】

`TestExtractGeo_NoAPIKeyRequired`は`GEMINI_API_KEY`を空にした上で`ExtractGeo()`を直接呼んでいたが、`ExtractGeo`はそもそもAPIキーを一切参照しないため、この環境変数操作は無意味だった。`main.go`/`sync.go`が実際に呼ぶ`extractWithMode(ctx, nil, ..., "geo")`経由に変更し、**genaiクライアントがnilでも・APIキーが無くても動く**ことを実際に検証する形に直した。

### 3.3 見送った指摘: テストのスタイル不統一【MEDIUM・見送り】

`row_check_test.go`がテーブル駆動テストになっておらず、`geo_extractor_test.go`とスタイルが揃っていないという指摘。動作・網羅性に問題はなく保守性のみの指摘のため、今回は対応を見送った。

### 3.4 確認して問題なしと判断された点

- **`fallback.go`は本当に骨組みのみ**: importは`"errors"`のみ。LLM呼び出し・Ollama・HTTP等の実処理コードは一切なし。計画通り
- **`row_check.go`のseverity設計**: `HasError`は`SeverityError`のみで真になり、警告（列間所要時間の一貫性）ではパイプラインが止まらないことをテストで確認済み
- **コマンドインジェクション**: `exec.Command`はシェルを経由せず引数を直接渡すため該当リスクなし
- **Python↔Go間のJSON契約**: `types.go`の`ExtractedData`と`geo_extract.py`の出力が型・キー名とも一致
- **既存コードとのエラーハンドリング・ログスタイルの一貫性**: 問題なし
- **CI設定**: Pythonセットアップ・`requirements.txt`・作業ディレクトリの整合性を確認済み

## 4. 報告後に見つかった追加の穴（大学サイトの実運用データで発覚・修正済み）

本報告の初版提出後、ユーザーから「手動`--from/--to`の運用は今後危ない」との指摘を受け、大学公式サイトを実際に見ながら追加検証したところ、**自動実行（`sync`）を静かに詰まらせる穴が2件**見つかった。いずれも修正済み。

### 4.1 年度が全く書かれていないPDFで自動実行が機能しない【修正済み】

`260912.pdf`・`260627.pdf`は本文中に「年度」の記載が一切なく、単発の`--pdf --from --to`手動実行では回避できても、**PDFごとに`--from/--to`を渡す仕組みが無い自動実行（`sync`）では、これらのPDFだけ静かに生成失敗する**構造だった。

大学の配布ファイル名が`YYMMDD[...].pdf`という規則（例: `260912.pdf`→2026年）で一貫していることを手元の全PDFで確認した上で、**年度記載が無い場合のみファイル名から年を補完する**フォールバックを追加した（`extractor/geo_extract.py`の`_year_from_filename`）。PDF本文が述べる月とファイル名の月が一致した場合のみ採用する安全策付き。年を1文字も捏造していない（PR #197のルールを維持）— ファイル名は大学自身が発行した情報であり、憶測ではない。

修正後、`--from/--to`無しで自動生成できることをテスト（`TestExtractGeo_YearFallsBackToFilename`）で固定。

### 4.2 数値の間隔が書かれていないシャトル区間で表全体が弾かれる【修正済み】

検証中に大学サイトへ新規掲載された`260927.pdf`（この報告を書いている最中に実際に公開された）で発覚。シャトル区間の備考が「約3〜5分間隔」のような数値表現ではなく「(乗車状況により運行)」だった。

- `extractor.go`のGeminiプロンプト自体が元々「間隔表記が無ければ空文字を入れる」と明記済み
- しかし`mapper.go`は間隔が解析できないと`Interval`を`nil`のままにし、`validator.go`が`Interval == nil`を無条件でエラーにしていた

**これは座標抽出固有のバグではなく、Gemini経路でも同じPDFで同じ理由により弾かれる、既存コードの穴**だった。ユーザーとの相談の結果、対応範囲をバックエンドに限定して修正:

- `mapper.go`: 数値間隔を解析できなかった場合、PDFの備考テキストをそのまま`Note`に retain する（テキストも無ければ「シャトル運行」を既定値に）
- `validator.go`: シャトル区間の必須条件を「`Interval`」から「**`Interval`または`Note`**」に緩和

**フロントエンド（`apps/web/`）は当初この節では対応を見送ったが、後の[6章](#6-フロントエンド公開api対応追加実施)で対応した。** `bus-row.tsx`が`bus.shuttleTimeRange.intervalRange.min`をオプショナルチェイニング無しで参照しており、`intervalRange`の無いシャトル区間を実際に表示させるとクラッシュする問題があったため。

修正後、実際に`260927.pdf`で表が生成されることをテスト（`TestExtractGeo_ShuttleWithoutNumericInterval`）で固定。

### 4.3 最終リグレッション

上記2件の修正後、13PDF（当初12枚＋新規発覚の`260927.pdf`）全てで`--from/--to`無しの自動生成に成功し、本番Geminiデータとの突き合わせ（比較可能な21ファイル）も全て完全一致を維持した。

## 5. 既知の仕様差分（対応不要・次回更新時に自然解消）

`260803.pdf`の「８月２９日運行」土曜セクションについて、本番Geminiパイプラインは「土曜ダイヤ（`validTo=2026-08-29`のweekday/saturday区分）」として扱っているのに対し、実装は「単独の特定日（`specificFrom=specificTo=2026-08-29`）」として扱う。PDFの記載自体が両方の解釈を許す書き方になっており、実装側の解釈の方が厳密だが本番と食い違う。

ユーザー判断により**本番データには手を加えない**。次回このPDFが処理される際、新しい解釈のデータが自然に生成される想定。

## 6. フロントエンド・公開API対応（追加実施）

[4.2節](#42-数値の間隔が書かれていないシャトル区間で表全体が弾かれる修正済み)で見送っていたフロントエンド対応を実施した。想定より範囲が広く、公開APIの契約（TypeSpec）まで含めた全レイヤーの変更になった。

- `apps/spec/models/transport.tsp`: `ShuttleSegment.intervalRange`を必須→任意化、`note`フィールドを追加。`pnpm run gen:clients`で`apps/api/pkg/oapi/models.gen.go`・`apps/web/generated/oas.d.ts`を再生成
- `apps/api/internal/domain/service.go` / `bus_stop_usecase.go`: `IntervalRange`を値型からポインタに変更し、`Note`をAPIレスポンスへ転送するよう修正
- `apps/web/lib/types/timetable.ts` / `lib/utils/timetable.ts`: 型を任意化し、間隔表示の共通ヘルパー`formatShuttleInterval`を追加（intervalRange→note→既定文言「シャトル運行」の順でフォールバック）
- レンダリング4箇所（`components/timetable/bus-row.tsx`、`components/home/bus-row.tsx`、`components/timetable/route-info-card.tsx`、`app/~offline/timetable/page.tsx`）を`intervalRange`無条件参照からガード付きに修正。オフラインキャッシュ表示側は別実装だったため個別対応

確認: `tsc --noEmit`・`eslint`・`prettier --check`すべて通過。Go側は`go build`/`go vet`とも問題なし（このAPI層に既存のGoテストは無いため、一時テストで`IntervalRange`のJSON変換のみ確認後削除）。

### 環境側の既知の問題（本作業とは無関係）

- `apps/spec/dist/openapi.yaml`と`apps/web/.next/`がroot所有の空ディレクトリ/ファイルとして残っており、通常のビルド・コード生成コマンドが権限エラーで失敗する（おそらく過去のDocker/CIビルドの残骸）。今回はtspconfig.yamlの出力先を一時的に変更する回避策で生成・検証まで完了させ、設定は元に戻した。**`sudo rm -rf apps/spec/dist apps/web/.next`での削除を推奨**

## 7. 未実施・対象外

- Geminiパスの削除（Issue #213の合意待ち）
- `timetable-sync.yml`のデフォルト切り替え
- LLMフォールバックの実処理（`fallback.go`はスタブのまま）
- コミット・PR作成

## 参考資料

- [検証レポート](./ocr-extraction-verification-report.md) — なぜこの方式を選んだか
- [実装計画書](./timetable-gen-geo-extractor-plan.md) — 実装前に確定させた事実・ハマりどころ
- Issue #213 — チーム合意形成の場
