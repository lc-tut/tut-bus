# TUT Bus Infrastructure

TerraformでTUT Busのインフラを管理します。

## 🏗️ アーキテクチャ

```
┌─────────────────┐
│   Vercel        │  ← Next.js Frontend (main branch → Production)
│  (Frontend)     │
└────────┬────────┘
         │
         │ API Call
         ↓
┌─────────────────┐
│  Cloudflare     │  ← DNS + SSL/TLS + CDN + DDoS Protection
│   (DNS/CDN)     │     tut-bus-api.hekuta.net
└────────┬────────┘
         │
         │ Proxy
         ↓
┌─────────────────┐
│  Google Cloud   │  ← Container-Optimized OS + Cloud SQL
│   (Backend)     │     API Server (Go) + PostgreSQL 17
└─────────────────┘
```

## 📦 モジュール構成

### `modules/gcp/` - Google Cloud Platform
- Compute Engine (Container-Optimized OS)
- Cloud SQL (PostgreSQL 17)
- VPC & Firewall
- IAM & Service Accounts

### `modules/cloudflare/` - DNS & CDN
- DNS管理 (A Record)
- SSL/TLS設定
- DDoS保護

### `modules/vercel/` - Frontend Hosting
- Next.jsプロジェクト
- GitHub連携 (自動デプロイ)
- 環境変数管理

## 🚀 クイックスタート

### 1. Docker イメージのビルド & プッシュ

APIサーバーのDockerイメージをビルドし、GCRにプッシュします：

```bash
# ワークスペースルートから実行
cd /path/to/tut-bus

# Dockerfileは apps/api/Dockerfile にあります
docker build -f apps/api/Dockerfile -t gcr.io/YOUR_PROJECT_ID/tut-bus-api:latest .
docker push gcr.io/YOUR_PROJECT_ID/tut-bus-api:latest
```

### 2. 認証情報を設定

```bash
# GCP
gcloud auth application-default login

# CloudflareとVercelは環境変数で設定（推奨）
export CLOUDFLARE_API_TOKEN="your-token"
export VERCEL_API_TOKEN="your-token"
```

### 2. 環境ごとの設定ファイルを作成

```bash
# 開発環境
cp dev.tfvars.example dev.tfvars
# 実際の値を編集

# 本番環境
cp production.tfvars.example production.tfvars
# 実際の値を編集
```

### 3. Workspace を使って環境を切り替え

```bash
# 初期化
terraform init

# 開発環境
terraform workspace new dev
terraform workspace select dev
terraform plan -var-file="dev.tfvars"
terraform apply -var-file="dev.tfvars"

# 本番環境
terraform workspace new production
terraform workspace select production
terraform plan -var-file="production.tfvars"
terraform apply -var-file="production.tfvars"

# 現在のworkspace確認
terraform workspace show

# workspace一覧
terraform workspace list
```

### 4. デプロイの確認

```bash
# リソースの状態を確認
terraform output

# APIにアクセス
curl http://$(terraform output -raw instance_public_ip):8000

# COSインスタンスにSSH接続
gcloud compute ssh tut-bus-api-production --zone=asia-northeast1-a

# コンテナの状態確認
docker ps -a --filter name=tut-bus-api
docker logs tut-bus-api

# systemdサービスの状態確認
sudo systemctl status tut-bus.service
```

## 🌍 環境変数

### API サーバーの環境変数

`infra/scripts/startup-script.sh` で以下の環境変数が設定されます：

#### データベース関連（Cloud SQL Auth Proxy経由）
- `DB_HOST`: 127.0.0.1（Cloud SQL Proxyのローカルエンドポイント）
- `DB_PORT`: 5432
- `DB_NAME`: データベース名
- `DB_USER`: postgres（IAM認証）
- `DB_PASSWORD`: ""（空 - IAM認証を使用）
- `DB_SSLMODE`: disable（Proxy経由のため不要）

**注意**:
- Cloud SQL Proxyが `--private-ip` でプライベートIP経由で接続
- IAM認証を使用するため、パスワード不要
- より安全でパスワード管理が不要

#### アプリケーション設定
- `API_ENV`: 環境（production）
- `HOST`: バインドするホスト（0.0.0.0）
- `PORT`: APIポート（8000）
- `DATA_PATH`: データファイルのパス（/app/data）
- `CORS_ALLOWED_ORIGINS`: CORSで許可するオリジン（Terraformの`cors_allowed_origins`変数から設定）

## 🔧 環境管理

### Workspaceで環境を分離

```bash
# 開発環境で作業
terraform workspace select dev
terraform apply -var-file="dev.tfvars"

# 本番環境だけデプロイ
terraform workspace select production
terraform apply -var-file="production.tfvars"

# 開発環境だけ削除
terraform workspace select dev
terraform destroy -var-file="dev.tfvars"
```

### 環境の違い

| 項目 | 開発環境 | 本番環境 |
|------|----------|----------|
| マシンタイプ | e2-micro | e2-medium |
| DNS | tut-bus-api-dev | tut-bus-api |
| SSL | flexible | strict |
| Vercelブランチ | dev | main |
| DB名 | tut-bus-db-dev | tut-bus-db-prod |
主要な設定は `terraform.tfvars` で管理します。詳細は各モジュールの `variables.tf` を参照してください。

## 🔒 セキュリティ

- Cloud SQLは`prevent_destroy`で保護されています
- API Tokenは環境変数での管理を推奨します
- `*.tfvars`ファイルは`.gitignore`されています（機密情報を含むため）
- 各workspaceは独立したstateを持ちます

## 📚 ドキュメント

- [Google Cloud Best Practices](https://cloud.google.com/docs/terraform/best-practices)
- [Terraform Module Patterns](https://developer.hashicorp.com/terraform/tutorials/modules/pattern-module-creation)
- 各モジュールの詳細: `modules/*/README.md`

## 🔄 ワークフロー

```bash
# 開発環境
terraform workspace new dev
terraform apply -var="environment=dev"

# 本番環境
terraform workspace new production
terraform apply -var="environment=production"
```

---

**Terraform**: >= 1.0  
**Providers**: Google Cloud ~> 7.0, Cloudflare ~> 5.0, Vercel ~> 4.0
