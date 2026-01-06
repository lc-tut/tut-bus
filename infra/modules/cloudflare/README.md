# Cloudflare Module

DNS管理とCDNを提供するモジュール。

## 構成

- **DNS**: Aレコード設定 (tut-bus-api.hekuta.net)
- **SSL/TLS**: Flexible/Full/Strictモード対応
- **Proxy**: DDoS保護、CDN機能

## SSL/TLSモード

- `flexible`: 開発環境向け (Cloudflare ↔ ブラウザ間のみSSL)
- `full`: 全区間SSL (証明書検証なし)
- `strict`: 本番環境推奨 (証明書検証あり)

## 使い方

詳細は`main.tf`と`variables.tf`を参照してください。
