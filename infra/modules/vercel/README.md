# Vercel Module

Next.jsフロントエンドをホスティングするモジュール。

## 構成

- **Vercel Project**: Next.jsプロジェクト設定
- **GitHub連携**: 自動ビルド・デプロイ
- **環境変数**: Production/Preview/Development対応
- **デプロイメント保持**: 各環境のデプロイ履歴管理

## デプロイフロー

- **Production**: `main`ブランチへのプッシュ
- **Preview**: プルリクエストごとに自動生成
- **Development**: ローカル開発環境

## 使い方

詳細は`main.tf`と`variables.tf`を参照してください。
