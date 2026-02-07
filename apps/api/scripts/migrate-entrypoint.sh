#!/bin/bash
# ========================================
# Migration Entrypoint Script
# ========================================
# Cloud Run Job のエントリポイント
#
# 環境変数:
#   MIGRATE_ACTION: up, up-1, down-1, version, seed
#   DB_USER, DB_NAME
#   INSTANCE_CONNECTION_NAME: Cloud SQLインスタンス接続名
#   USE_IAM_AUTH: true の場合、IAM認証を使用（パスワード不要）
# ========================================

set -euo pipefail

# IAM認証トークン取得
if [ "${USE_IAM_AUTH:-false}" = "true" ]; then
  echo "🔑 IAM認証トークンを取得中..."
  IAM_TOKEN=$(wget -qO- --header="Metadata-Flavor: Google" \
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" \
    | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

  DB_URL="postgres://${DB_USER}:${IAM_TOKEN}@/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}&sslmode=disable"
  PSQL_AUTH_ENV="PGPASSWORD=${IAM_TOKEN}"
else
  DB_URL="postgres://${DB_USER}:${DB_PASSWORD:-}@/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"
  PSQL_AUTH_ENV="PGPASSWORD=${DB_PASSWORD:-}"
fi

ACTION="${MIGRATE_ACTION:-version}"

echo "========================================"
echo "  TUT Bus Migration Runner"
echo "========================================"
echo "Action:   ${ACTION}"
echo "Database: ${DB_NAME}"
echo "Instance: ${INSTANCE_CONNECTION_NAME}"
echo "========================================"

# 現在のバージョン表示
echo ""
echo "📋 現在のマイグレーションバージョン:"
migrate -path ./migrations -database "${DB_URL}" version 2>&1 || echo "  (バージョン未設定)"

case "${ACTION}" in
  "version")
    echo ""
    echo "🔧 postgres ユーザーへの権限付与..."
    env ${PSQL_AUTH_ENV} psql \
      -h "/cloudsql/${INSTANCE_CONNECTION_NAME}" \
      -U "${DB_USER}" -d "${DB_NAME}" \
      --quiet -v ON_ERROR_STOP=1 <<'GRANT_SQL'
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
GRANT_SQL
    echo "✅ 権限付与完了"
    ;;

  "up")
    echo ""
    echo "⬆️ 全ペンディングマイグレーションを適用中..."
    migrate -path ./migrations -database "${DB_URL}" up
    echo "✅ マイグレーション適用完了"
    ;;

  "up-1")
    echo ""
    echo "⬆️ 1つマイグレーションを適用中..."
    migrate -path ./migrations -database "${DB_URL}" up 1
    echo "✅ マイグレーション適用完了"
    ;;

  "down-1")
    echo ""
    echo "⬇️ 1つマイグレーションをロールバック中..."
    migrate -path ./migrations -database "${DB_URL}" down 1
    echo "✅ ロールバック完了"
    ;;

  "seed")
    echo ""
    echo "🌱 シードデータを適用中..."

    # 全シードファイルを収集
    SEED_FILES=""
    for f in $(ls ./seeds/common/*.sql 2>/dev/null | sort); do
      SEED_FILES="${SEED_FILES} ${f}"
    done
    for f in $(ls ./seeds/production/*.sql 2>/dev/null | sort); do
      SEED_FILES="${SEED_FILES} ${f}"
    done

    if [ -z "${SEED_FILES}" ]; then
      echo "  シードファイルがありません"
    else
      # Phase 1: ドライラン（BEGIN + 実行 + ROLLBACK）
      echo ""
      echo "🔍 Phase 1: ドライラン（トランザクション検証）..."
      DRY_RUN_SQL="BEGIN;"
      for f in ${SEED_FILES}; do
        DRY_RUN_SQL="${DRY_RUN_SQL}
$(cat "$f")"
      done
      DRY_RUN_SQL="${DRY_RUN_SQL}
ROLLBACK;"

      echo "${DRY_RUN_SQL}" | env ${PSQL_AUTH_ENV} psql \
        -h "/cloudsql/${INSTANCE_CONNECTION_NAME}" \
        -U "${DB_USER}" -d "${DB_NAME}" \
        --quiet -v ON_ERROR_STOP=1

      echo "  ✅ ドライラン成功（SQLにエラーなし）"

      # Phase 2: 本番適用
      echo ""
      echo "🚀 Phase 2: シードデータを本番適用中..."
      for f in ${SEED_FILES}; do
        case "$f" in
          ./seeds/common/*) label="common" ;;
          ./seeds/production/*) label="production" ;;
          *) label="unknown" ;;
        esac
        echo "  [${label}] $(basename "$f")"
        env ${PSQL_AUTH_ENV} psql \
          -h "/cloudsql/${INSTANCE_CONNECTION_NAME}" \
          -U "${DB_USER}" -d "${DB_NAME}" \
          -f "$f" --quiet -v ON_ERROR_STOP=1
      done
    fi

    echo "✅ シードデータ適用完了"
    ;;

  *)
    echo "❌ 不明なアクション: ${ACTION}"
    echo "使用可能: version, up, up-1, down-1, seed"
    exit 1
    ;;
esac

# 最終バージョン表示
echo ""
echo "📋 最終マイグレーションバージョン:"
migrate -path ./migrations -database "${DB_URL}" version 2>&1 || echo "  (バージョン未設定)"

echo ""
echo "✅ 完了"
