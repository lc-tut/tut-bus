# timetable-gen

東京工科大学スクールバスの時刻表 PDF を解析し、API が読み込む JSON ファイルを自動生成するツールです。

## 概要

TUT 公式サイトから時刻表 PDF を取得し、Gemini API で時刻データを抽出して `data/services/` に JSON を出力します。毎週 GitHub Actions が自動実行し、PDF の更新があれば PR を作成します。

## セットアップ

```bash
cd apps/api/tools/timetable-gen
echo 'GEMINI_API_KEY=your_api_key_here' > .env
go mod tidy
```

Gemini API キーは [Google AI Studio](https://aistudio.google.com/) から取得できます。

## 使い方

### PDF から手動生成

```bash
go run . --pdf path/to/timetable.pdf
```

有効期間を明示する場合:

```bash
go run . --pdf timetable.pdf --from 2026-04-07 --to 2026-07-29
```

### TUT サイトから PDF を取得

```bash
go run . fetch
```

新規・更新 PDF のみダウンロードします（SHA256 による差分検知）。

### フェッチ〜生成〜アーカイブを一括実行

```bash
go run . sync
```

1. TUT サイトをスクレイプして新規・更新 PDF を取得
2. 期限切れ JSON を `archived/` に移動
3. 新規 PDF ごとに JSON を生成して `data/services/` に出力

ローカル Docker の API を自動再起動する場合:

```bash
go run . sync --restart-api
```

### 生成済み JSON を確認

```bash
go run . view ../../data/services/
go run . view ../../data/services/hachioji-to-school-weekday-20260407.json
```

## Taskfile から実行

```bash
task api:generate:timetable -- --pdf path/to/timetable.pdf
task api:generate:timetable -- sync
task api:generate:timetable -- view ../../data/services/
```

## 出力ファイル

### ファイル名・ID の形式

```
{from}-to-{to}-{daytype}-{validFrom}.json
例: hachioji-to-school-weekday-20260407.json
```

日付をIDに含めることで、学期をまたいだスケジュールが同一ディレクトリに共存できます。

### JSON 構造

```json
{
  "id": "hachioji-to-school-weekday-20260407",
  "name": "八王子駅 → 大学（八王子駅方面） (平日 2026-04-07〜)",
  "from": { "stopId": 1, "displayName": "八王子駅" },
  "to":   { "stopId": 3, "displayName": "大学（八王子駅方面）" },
  "direction": "inbound",
  "validityPeriods": [
    { "from": "2026-04-07", "to": "2026-07-29" }
  ],
  "segments": [
    {
      "segmentType": "fixed",
      "condition": { "type": "dayType", "value": "weekday" },
      "times": [
        { "departure": "7:30", "arrival": "7:48" }
      ]
    },
    {
      "segmentType": "shuttle",
      "condition": { "type": "dayType", "value": "weekday" },
      "startTime": "7:55",
      "endTime": "9:15",
      "interval": { "min": 3, "max": 5 }
    }
  ]
}
```

### アーカイブ

`sync` 実行時に `validityPeriods` の最大 `to` が当日より前のファイルは `archived/` へ自動移動されます。

## 処理の流れ

```
PDF
 └─ extractor.go  Gemini で生データを抽出（時刻の列解釈はしない）
 └─ mapper.go     列インデックスを確定し ServiceData に変換
                  「～」行を検知してシャトル区間に分割
 └─ validator.go  必須フィールド・時刻形式をチェック
 └─ JSON 出力 → data/services/
```

Gemini の役割は **表の読み取り** のみです。どの列が出発・到着かの判断は Go コードが行います。

> **旧 service-generator との違い**: 旧ツールは Gemini に最終的な JSON 形式まで生成させていました。列解釈も AI 任せだったため「出発・到着が逆になる」「時刻が抜ける」などの誤りが検証しにくい問題がありました。現在は Gemini を「表の読み取り専用」に限定し、列の割り当てを Go コードで確定的に行うことで安定性を高めています。

### Gemini が出力する中間フォーマット

Gemini は以下のような `ExtractedData` 形式を返します。列の意味（どれが出発でどれが到着か）はまだ解釈されていません。

```json
{
  "tables": [
    {
      "stationName": "八王子みなみ野駅",
      "dayType": "weekday",
      "validFrom": "2026-04-07",
      "validTo": "2026-07-29",
      "segments": [
        {
          "type": "fixed",
          "rows": [
            ["7:29", "7:38", "7:45"],
            ["7:38", "7:47", "7:53"],
            ["～",   "～",   "～",   "約3〜5分間隔"],
            ["9:15", "9:24", "9:33"]
          ]
        }
      ]
    }
  ]
}
```

この中間データを `mapper.go` が受け取り、outbound / inbound の2つの `ServiceData` に変換します。

### 列の解釈

PDF の時刻表は常に 3 列構成です。Go コードが列インデックスを固定で割り当てます：

| 列 | 意味 |
|----|------|
| 列 0 | キャンパス発（大学の出発時刻） |
| 列 1 | 駅・会館（中間地点の時刻） |
| 列 2 | キャンパス着（大学への到着時刻） |

- **outbound（大学→駅）**: 列 0 が departure、列 1 が arrival
- **inbound（駅→大学）**: 列 1 が departure、列 2 が arrival

### シャトル運行の検出

朝のラッシュ時など「～ ～ ～」という区切り行がある区間はシャトル運行（短い間隔で折り返し運転）を表します。

**抽出の仕組み:**

1. Gemini は「～」行を `["～", "～", "～", "約3〜5分間隔"]` の形で fixed rows に含めて出力する（4列目に間隔メモ）
2. mapper.go が「～」行を検出して前後の fixed 区間を分割
3. シャトル区間の `startTime` / `endTime` は前後の fixed 行の時刻から補完
4. `interval` は 4 列目の文字列（例: `"約3〜5分間隔"`）を正規表現でパース

**PDF 上の表示例:**

```
7:50  8:05  8:08
7:55  8:10  8:13
～    ～    ～    約3〜5分間隔
9:15  9:30  9:33
```

**生成される JSON:**

```json
{ "segmentType": "fixed",   "times": [{"departure":"7:50","arrival":"8:08"}, ...] },
{ "segmentType": "shuttle", "startTime": "7:55", "endTime": "9:15", "interval": {"min":3,"max":5} },
{ "segmentType": "fixed",   "times": [{"departure":"9:15","arrival":"9:33"}, ...] }
```

## 自動同期（GitHub Actions）

`.github/workflows/timetable-sync.yml` が毎週月曜 0:00 JST に実行されます。

1. TUT サイトをスクレイプ
2. 新規・更新 PDF があれば JSON を再生成
3. 変更がある場合は `dev` ブランチへの PR を自動作成

PR をマージして `main` にマージされると `api-deploy.yml` がデプロイをトリガーします。

> **注意**: ワークフローには GitHub Secrets に `GEMINI_API_KEY` の登録が必要です。

## ディレクトリ構成

```
timetable-gen/
├── main.go        エントリポイント・サブコマンドルーティング
├── extractor.go   Gemini API 呼び出し・PDF 解析
├── mapper.go      列解釈・シャトル検知・ServiceData 変換
├── validator.go   生成 JSON のバリデーション
├── sync.go        sync サブコマンド実装
├── fetcher.go     TUT サイトスクレイプ・PDF ダウンロード
├── view.go        view サブコマンド実装
├── config.go      駅情報・ID 生成ロジック
├── types.go       データ型定義
├── .env           Gemini API キー設定（gitignore）
└── downloaded/    ダウンロード済み PDF キャッシュ（gitignore）
```
