# Service Generator の使い方

## セットアップ

1. 依存パッケージのインストール:
```bash
cd apps/api/tools/service-generator
go mod tidy
```

2. Gemini API Keyの設定:
```bash
export GEMINI_API_KEY="your-api-key-here"
```

または `.env` ファイルを作成:
```bash
GEMINI_API_KEY=your-api-key-here
```

## 使用方法

### 基本的な使い方

```bash
go run main.go --pdf example.pdf
```

### 出力先を指定

```bash
go run main.go --pdf example.pdf --output ../../data/services
```

### Taskfile経由で実行

```bash
# ルートの Taskfile.yml に以下を追加した場合
task generate:service -- --pdf example.pdf
```

## 期待される入力

- PDFファイル（バスの時刻表）
- 出発地、到着地、時刻が記載されていること

## 出力

`data/services/generated` ディレクトリに以下の形式のJSONファイルが生成されます：

```json
{
  "id": "generated-route-id",
  "name": "ルート名",
  "from": { "stopId": 1, "displayName": "出発地" },
  "to": { "stopId": 2, "displayName": "到着地" },
  "direction": "inbound",
  "validityPeriods": [
    { "from": "2025-09-22", "to": "2025-12-19" }
  ],
  "segments": [
    {
      "segmentType": "fixed",
      "condition": { "type": "dayType", "value": "weekday" },
      "times": [
        { "departure": "08:14", "arrival": "08:24" }
      ]
    }
  ]
}
```
