# Development Seeds

開発・テスト用のサンプルデータを管理するフォルダです。

## ❗ 注意

- **本番環境では絶対に実行しないでください（TRUNCATEを含むため）**
- 開発環境のリセット用なので、何度実行しても同じ状態になります

## common/production との違い

| フォルダ | TRUNCATE | UPDATE/DELETE | 本番実行 | 再実行で既存データ |
|---|---|---|---|---|
| `common/` | ❌禁止 | ❌禁止 | ✅安全 | 保持される |
| `production/` | ❌禁止 | ❌禁止 | ✅安全 | 保持される |
| `development/` | ✅許可 | ✅許可 | ❌禁止 | **全リセットされる** |

CIで `common/` と `production/` に破壊的な操作が含まれていないか、およびシードの冒等性が自動検証されます。

## ルール

- ファイル名は `NNNNNN_<説明>.sql` 形式（例: `000001_sample_bus_stops.sql`）
- 開発環境でのみ使用（本番には絶対に適用しない）
- **冪等性を担保すること**（何度実行しても同じ結果になるように）
- テストに便利なデータを自由に追加してOK

## 実行方法

```bash
cd apps/api

# 開発用シードデータを投入
task db:seed:dev

# 本番用 + 開発用シードデータを投入
task db:seed:all

# DBをリセットしてシードも再投入
task db:reset:seed
```

## Docker Compose 初回起動時

`docker compose up` 後に以下を実行：

```bash
task api:migrate:up
task api:db:seed:all
```
