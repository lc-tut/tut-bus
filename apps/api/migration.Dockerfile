# ========================================
# Migration Runner Image
# ========================================
# Cloud Run Job として実行し、Cloud SQL Auth Proxy 経由で
# プライベートIPのCloud SQLにマイグレーションを適用する
# ========================================

FROM alpine:3.20

ARG MIGRATE_VERSION=v4.18.3

RUN apk add --no-cache \
    postgresql15-client \
    curl \
    bash \
  && curl -fsSL "https://github.com/golang-migrate/migrate/releases/download/${MIGRATE_VERSION}/migrate.linux-amd64.tar.gz" \
    | tar xz -C /usr/local/bin/ \
  && migrate --version

WORKDIR /app

# マイグレーションファイルとシードデータをコピー
COPY db/migrations ./migrations
COPY db/seeds ./seeds
COPY scripts/migrate-entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
