# Production Seeds

本番環境で必要な初期データ（マスターデータ）を管理するフォルダです。

## ❗ 運用ルール

**Seeds = 初回セットアップ専用。運用開始後のデータ変更には使わない。**

運用中にデータを追加・変更したい場合は `db/migrations/` に data migration を作成してください。
管理画面で編集したデータが上書きされることはありません（`ON CONFLICT DO NOTHING` を使用するため）。

## ルール

- ファイル名は `NNNNNN_<説明>.sql` 形式（例: `000001_initial_bus_stops.sql`）
- **冪等性を担保すること**（`INSERT ... ON CONFLICT DO NOTHING` や `WHERE NOT EXISTS` を使用）
- データの削除・更新は原則禁止（追加のみ）
- マイグレーション適用後に実行する前提
### 禁止事項（CIで自動検査されます）

- `TRUNCATE` / `DELETE` / `UPDATE` 禁止 — 運用中のデータが破壊されます
- `INSERT` には必ず `ON CONFLICT DO NOTHING` を付ける

## 🔒 再実行時の安全性

`ON CONFLICT DO NOTHING` により、既存データは絶対に上書きされません。
管理画面で編集したデータや、運用中に追加したデータはそのまま保持されます。
## 実行方法

### ローカルから本番DBへ適用

```bash
# Cloud SQL Auth Proxy経由で接続
cloud-sql-proxy main-vcompute:asia-northeast1:tut-bus-db-prod

# 別ターミナルで実行
psql -h localhost -U postgres -d tutbus < apps/api/db/seeds/production/000001_initial_bus_stops.sql
```

### 開発環境での適用

```bash
cd apps/api
task db:seed:prod
```
