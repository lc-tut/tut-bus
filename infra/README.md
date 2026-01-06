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
│  Google Cloud   │  ← App Engine (F1) + Cloud SQL
│   (Backend)     │     API Server (Go) + PostgreSQL 15
└─────────────────┘
```

## 📦 モジュール構成

### `modules/gcp/` - Google Cloud Platform
- App Engine Standard Environment
- Cloud SQL (PostgreSQL 15)
- VPC Network & Private Service Connection
- IAM & Service Accounts

### `modules/cloudflare/` - DNS & CDN
- DNS管理 (CNAME Record → App Engine)
- SSL/TLS設定
- DDoS保護

### `modules/vercel/` - Frontend Hosting
- Next.jsプロジェクト
- GitHub連携 (自動デプロイ)
- 環境変数管理

## 🚀 クイックスタート

### 1. App Engine へのデプロイ準備

App Engine Standard環境を使用するため、Dockerイメージのビルドは不要です。
ソースコードから直接デプロイされます。

```bash
# App Engineへのデプロイ
cd apps/api
gcloud app deploy app.yaml --project=YOUR_PROJECT_ID
```

### 2. 認証情報を設定

```bash
# GCP
gcloud auth application-default login

# CloudflareとVercelは環境変数で設定（推奨）
export CLOUDFLARE_API_TOKEN="your-token"
export VERCEL_API_TOKEN="your-token"
```

### 3. 環境ごとの設定ファイルを作成

```bash
# 開発環境
cp dev.tfvars.example dev.tfvars
# 実際の値を編集

# 本番環境
cp production.tfvars.example production.tfvars
# 実際の値を編集
```

### 4. Workspace を使って環境を切り替え

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

### 5. デプロイの確認

```bash
# リソースの状態を確認
terraform output

# APIにアクセス
curl https://tut-bus-api.hekuta.net/api/bus-stops/groups

# App Engineのログ確認
gcloud app logs tail --project=YOUR_PROJECT_ID

# App Engineサービスの状態確認
gcloud app describe --project=YOUR_PROJECT_ID

# デプロイされたバージョン確認
gcloud app versions list --project=YOUR_PROJECT_ID
```

## 🌍 環境変数

### API サーバーの環境変数

`apps/api/app.yaml` で以下の環境変数が設定されます：

#### データベース関連（App Engine標準環境）
- `DB_HOST`: `/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME` (Unix socket)
- `DB_PORT`: "" (空)
- `DB_NAME`: データベース名
- `DB_USER`: Cloud SQL IAMユーザー（postgres）
- `DB_PASSWORD`: "" (空 - IAM認証を使用)
- `DB_SSLMODE`: disable (Unix socket経由のため不要)

**注意**:
- App Engine標準環境ではCloud SQL Unix socketを使用
- IAM認証を使用するため、パスワード不要
- VPC経由のプライベート接続で安全

#### アプリケーション設定
- `API_ENV`: 環境（production）
- `HOST`: バインドするホスト（0.0.0.0）
- `PORT`: App Engineが自動設定（環境変数 $PORT）
- `DATA_PATH`: データファイルのパス（./data）
- `CORS_ALLOWED_ORIGINS`: CORSで許可するオリジン（Terraformの`cors_allowed_origins`変数から設定）

### Vercel（Frontend）の環境変数

#### 開発環境 (.env.local)

```bash
# Google Analytics ID
NEXT_PUBLIC_GA_ID=

# APIエンドポイント
NEXT_PUBLIC_API_URL=http://localhost:8000  # ローカル開発時
# または
NEXT_PUBLIC_API_URL=https://tut-bus-api.hekuta.net  # 本番API

# アナウンスメントバナー（任意）
NEXT_PUBLIC_ANNOUNCEMENT_MESSAGE=年末年始の臨時便が多く、現在の時刻表には反映されていません。ご不便をおかけして申し訳ございません。
NEXT_PUBLIC_ANNOUNCEMENT_TITLE=お知らせ
NEXT_PUBLIC_ANNOUNCEMENT_TYPE=warning  # "info" または "warning"
```

#### 本番環境（Vercel Dashboard で設定）

1. [Vercel Dashboard](https://vercel.com/dashboard) > プロジェクト `tut-bus-web` 選択
2. Settings > Environment Variables に移動
3. 以下の環境変数を追加：

| 環境変数名 | 値の例 | 説明 | 必須 |
|-----------|--------|------|------|
| `NEXT_PUBLIC_GA_ID` | G-XXXXXXXXXX | Google Analytics ID | No |
| `NEXT_PUBLIC_API_URL` | https://tut-bus-api.hekuta.net | API URL | Yes |
| `NEXT_PUBLIC_ANNOUNCEMENT_MESSAGE` | 年末年始の臨時便が多く... | バナーメッセージ | No |
| `NEXT_PUBLIC_ANNOUNCEMENT_TITLE` | お知らせ | バナータイトル | No |
| `NEXT_PUBLIC_ANNOUNCEMENT_TYPE` | warning | info/warning | No |

4. Environment を `Production` に設定して Save
5. 再デプロイ

**Vercel CLI での設定：**

```bash
# 環境変数を追加
vercel env add NEXT_PUBLIC_ANNOUNCEMENT_MESSAGE production
# プロンプトでメッセージを入力

vercel env add NEXT_PUBLIC_ANNOUNCEMENT_TYPE production
# warning または info を入力

# 再デプロイ
vercel --prod
```

**バナーを非表示にする：**
- `NEXT_PUBLIC_ANNOUNCEMENT_MESSAGE` を削除または空にする

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
| App Engineインスタンス | F1 | F1 |
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
