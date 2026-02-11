# Common Seeds

本番・開発の両方で共通して使用するマスターデータを管理するフォルダです。

## ❗ 運用ルール

**Seeds = 初回セットアップ専用。運用開始後のデータ変更には使わない。**

| やりたいこと | 使うもの |
|---|---|
| 初回のマスターデータ投入 | `seeds/common/` または `seeds/production/` |
| 運用中にデータ追加・変更 | `db/migrations/`（data migration） |
| 管理画面での個別編集 | アプリのAPI経由 |

運用中にバス停を追加したい場合は、seedsではなくmigrationを作成してください：

```sql
-- db/migrations/000002_add_new_bus_stop.up.sql
INSERT INTO bus_stops (name, lat, lng)
VALUES ('新しいバス停', 34.7200, 137.3900)
ON CONFLICT DO NOTHING;

-- db/migrations/000002_add_new_bus_stop.down.sql
DELETE FROM bus_stops WHERE name = '新しいバス停';
```

## ファイルルール

- ファイル名は `NNNNNN_<説明>.sql` 形式（例: `000001_bus_stop_master.sql`）
- **冪等性を担保すること**（`INSERT ... ON CONFLICT DO NOTHING` 等を使用）
- 全環境で必ず必要なデータのみを配置
### 禁止事項（CIで自動検査されます）

- `TRUNCATE` 禁止 — 既存データが全消えします
- `DELETE` 禁止 — 運用中のデータが削除されます
- `UPDATE` 禁止 — 管理画面で編集した内容が上書きされます
- `INSERT` には必ず `ON CONFLICT DO NOTHING` を付ける

## 🔒 再実行時の安全性

`ON CONFLICT DO NOTHING` を使用するため、seedsを何度実行しても：

- ✅ 既存データは上書きされない
- ✅ 管理画面で編集した内容はそのまま残る
- ✅ 新規追加分のみインサートされる

```
1. seed適用 → バス停 A, B, C が INSERT される
2. 管理画面で B の名前を変更、D を追加
3. seed再実行 → A, B, C は ON CONFLICT でスキップ。B の変更は保持。D もそのまま。
```

この動作はCIの「シード冒等性テスト」で自動検証されます。
## 実行順序

```
common → production → development
```

- `common/` は全環境で最初に適用
- `production/` は本番追加データ
- `development/` は開発専用データ（テスト用ダミー等）

## 実行方法

```bash
cd apps/api

# common seeds のみ投入
task db:seed:common

# 全環境向け（common + production + development）
task db:seed:all
```
