# GCP Module

Google Cloudインフラを管理するモジュール。

## 構成

- **App Engine**: Standard Environment (Go 1.22, APIサーバー)
- **Cloud SQL**: PostgreSQL 17 (データベース)
- **VPC Network**: Private Service Connection
- **IAM**: サービスアカウント、Cloud SQL IAM認証

## セキュリティ

- データベースは`prevent_destroy = true`で保護
- サービスアカウントは最小権限の原則に従う
- Cloud SQL IAM認証でパスワード不要
- VPCプライベート接続でセキュアなDB接続

## 使い方

詳細は各`.tf`ファイルと`variables.tf`を参照してください。
