# GCP Module

Google Cloudインフラを管理するモジュール。

## 構成

- **Compute Engine**: Container-Optimized OS (APIサーバー)
- **Cloud SQL**: PostgreSQL 17 (データベース)
- **VPC Network**: カスタムVPC、サブネット、ファイアウォール
- **IAM**: サービスアカウント、権限管理

## セキュリティ

- データベースは`prevent_destroy = true`で保護
- サービスアカウントは最小権限の原則に従う
- ファイアウォールでポートを制限 (API: 8000, SSH: 22)

## 使い方

詳細は各`.tf`ファイルと`variables.tf`を参照してください。
