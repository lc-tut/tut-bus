#!/bin/bash
# ========================================
# PostgreSQL 初期化スクリプト（開発環境用）
# ========================================
# docker-entrypoint-initdb.d に配置すると、DBの初回作成時のみ自動実行されます。
# 既存データがある場合はスキップされるため、安全に使用できます。
#
# 注意: このスクリプトは postgres ユーザーとして実行されます。
# ========================================

set -e

echo "🔧 開発環境の初期化を開始..."

# 拡張機能の有効化（必要に応じて）
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 必要な拡張機能をここに追加
    -- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

echo "✅ 開発環境の初期化が完了しました"
echo "💡 マイグレーションとシードデータは別途実行してください:"
echo "   task migrate:up && task db:seed:all"
