# GCP Module

Google Cloudインフラを管理するモジュール。

## 構成

- **App Engine**: Standard Environment (Go 1.24, APIサーバー)
- **IAM**: サービスアカウント、Workload Identity (GitHub Actions)
- **Artifact Registry**: Docker イメージ

APIはデータベースを使わず、`apps/api/data/` の JSON ファイルを読み込みます。

## セキュリティ

- サービスアカウントは最小権限の原則に従う

## 使い方

詳細は各`.tf`ファイルと`variables.tf`を参照してください。
