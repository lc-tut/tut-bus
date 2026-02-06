# TUT Bus Infrastructure - ゼロからのセットアップ手順

このドキュメントは、TUT Bus (バスNavi) のインフラとアプリケーション環境を **完全にゼロから構築する** 場合の手順書です。

---

## 目次

1. [前提知識](#1-前提知識)
2. [必要なツールのインストール](#2-必要なツールのインストール)
3. [外部サービスのアカウント作成と API キー発行](#3-外部サービスのアカウント作成と-api-キー発行)
4. [GCP プロジェクトの初期設定](#4-gcp-プロジェクトの初期設定)
5. [Terraform によるインフラ構築](#5-terraform-によるインフラ構築)
6. [GitHub Actions の設定](#6-github-actions-の設定)
7. [アプリケーションのローカル開発環境](#7-アプリケーションのローカル開発環境)
8. [API の本番デプロイ (App Engine)](#8-api-の本番デプロイ-app-engine)
9. [フロントエンドの本番デプロイ (Vercel)](#9-フロントエンドの本番デプロイ-vercel)
10. [運用・トラブルシューティング](#10-運用トラブルシューティング)

---

## 1. 前提知識

このプロジェクトの構築・運用に関わるには、以下の知識が必要です。

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| 言語 | TypeScript, Go | フロントエンド / バックエンド |
| フレームワーク | Next.js (App Router), Echo (Go) | Web / API |
| API 定義 | TypeSpec → OpenAPI 3.0 → コード生成 | API スキーマ定義 |
| DB | PostgreSQL, sqlc | データベース + Go コード生成 |
| 認証 | Better Auth + GitHub OAuth | 管理画面のアクセス制御 |
| IaC | Terraform (HCL) | GCP / Cloudflare / Vercel のインフラ管理 |
| CI/CD | GitHub Actions | Terraform plan/apply の自動化 |
| クラウド | GCP (App Engine, Cloud SQL, VPC, IAM) | バックエンド基盤 |
| DNS/CDN | Cloudflare | DNS, SSL/TLS, DDoS 保護 |
| ホスティング | Vercel | Next.js フロントエンド |
| タスクランナー | Task (go-task), Turborepo | ローカル開発の自動化 |
| パッケージ管理 | pnpm (monorepo) | Node.js 依存パッケージ |
| コンテナ | Docker Compose | ローカル開発環境 |

---

## 2. 必要なツールのインストール

### 2.1 基本ツール

```bash
# Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js (v24.x)
brew install node@24
# または nvm / fnm を使用

# pnpm (v9.x)
corepack enable
corepack prepare pnpm@9.15.5 --activate

# Go (1.24.x)
brew install go

# Docker Desktop
# https://www.docker.com/products/docker-desktop/ からインストール

# Task (タスクランナー)
brew install go-task
```

### 2.2 開発ツール

```bash
# Air (Go ホットリロード、Docker 内で使用)
go install github.com/air-verse/air@latest

# golang-migrate (DB マイグレーション)
brew install golang-migrate

# sqlc (Go コード生成)
brew install sqlc

# oapi-codegen (OpenAPI → Go コード生成)
go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest

# openapi-typescript (OpenAPI → TypeScript 型定義)
# pnpm install 時に自動インストール

# TypeSpec コンパイラ
# pnpm install 時に自動インストール
```

### 2.3 インフラツール

```bash
# Terraform (>= 1.14.2)
brew install terraform
# または tfenv でバージョン管理
# brew install tfenv && tfenv install 1.14.2

# gcloud CLI
brew install --cask google-cloud-sdk

# GitHub CLI
brew install gh
```

---

## 3. 外部サービスのアカウント作成と API キー発行

### 3.1 GCP (Google Cloud Platform)

1. [GCP Console](https://console.cloud.google.com/) でプロジェクトを作成
   - プロジェクト ID をメモ (例: `main-vcompute`)
2. 請求先アカウントを紐付け
3. ローカルで認証:
   ```bash
   gcloud auth login --update-adc
   gcloud config set project <PROJECT_ID>
   ```

### 3.2 Cloudflare

1. [Cloudflare](https://dash.cloudflare.com/) でアカウント作成
2. DNS を管理するドメインを追加 (例: `hekuta.net`)
   - ネームサーバーの移管完了を確認
3. API トークンを発行:
   - **My Profile → API Tokens → Create Token**
   - テンプレート: 「Edit zone DNS」をベースに
   - 必要な権限:
     - Zone: DNS (Edit)
     - Zone: Zone (Read)
     - Zone: Zone Settings (Edit)
   - 対象ゾーン: 使用するドメインに限定
4. トークンをメモ → `CLOUDFLARE_API_TOKEN`

### 3.3 Vercel

1. [Vercel](https://vercel.com/) でアカウント作成（チーム利用の場合はチーム作成）
2. API トークンを発行:
   - **Settings → Tokens → Create Token**
   - Scope: チーム全体
   - Expiration: 必要に応じて設定
3. トークンをメモ → `VERCEL_API_TOKEN`
4. チーム ID をメモ (Settings ページの URL: `/teams/<TEAM_ID>`)

### 3.4 GitHub OAuth App（管理画面認証用）

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. 設定値:
   - Application name: `TUT Bus Admin` (任意)
   - Homepage URL: `https://<本番ドメイン>` (例: `https://tut-bus.lcn.ad.jp`)
   - Authorization callback URL: `https://<本番ドメイン>/api/auth/callback/github`
3. 作成後の値をメモ:
   - Client ID → `AUTH_GITHUB_ID`
   - Client Secret (Generate) → `AUTH_GITHUB_SECRET`

### 3.5 GitHub Organization のチーム

管理画面のアクセス制御は GitHub Organization のチームメンバーシップで行います。

1. GitHub → Organization (`lc-tut`) → **Teams**
2. 管理者用チームを作成 (例: `linuxclub-tut-bus`)
3. メンバーを追加
4. チーム slug をメモ → `auth_allowed_team`

---

## 4. GCP プロジェクトの初期設定

### 4.1 Terraform state 用 GCS バケットの作成

> **重要**: このバケットは Terraform 管理外です。`terraform init` の前に **手動で** 作成する必要があります。  
> Terraform 自身の state を保存するバケットを Terraform で管理すると循環依存になるためです。

```bash
BUCKET_NAME="tut-bus-terraform-state"  # グローバル一意の名前にすること

gcloud storage buckets create gs://${BUCKET_NAME} \
  --location=asia-northeast1 \
  --uniform-bucket-level-access \
  --public-access-prevention=enforced

# バージョニング有効化（state 破損時のリカバリ用）
gcloud storage buckets update gs://${BUCKET_NAME} --versioning

# ライフサイクルルール（新バージョンが5個以上になったら古いアーカイブを削除）
cat > /tmp/lifecycle.json << 'EOF'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {
        "numNewerVersions": 5,
        "isLive": false
      }
    }
  ]
}
EOF
gcloud storage buckets update gs://${BUCKET_NAME} \
  --lifecycle-file=/tmp/lifecycle.json
```

作成後、`infra/backend.tf` の `bucket` がバケット名と一致しているか確認:

```hcl
# infra/backend.tf
terraform {
  backend "gcs" {
    bucket = "tut-bus-terraform-state"  # ← ここを実際のバケット名に
    prefix = "terraform/state"
  }
}
```

### 4.2 App Engine アプリケーションの作成

App Engine は **1プロジェクトにつき1回だけ** 作成でき、削除できません。  
Terraform で管理していますが、初回は手動で作成が必要な場合があります。

```bash
gcloud app create --region=asia-northeast1 --project=<PROJECT_ID>
```

---

## 5. Terraform によるインフラ構築

### 5.1 secrets.tfvars の作成

```bash
cd infra
cp secrets.tfvars.example secrets.tfvars
```

以下の値を設定:

| 変数 | 値 | 取得元 |
|------|-----|--------|
| `cloudflare_api_token` | Cloudflare API トークン | [3.2 Cloudflare](#32-cloudflare) |
| `vercel_api_token` | Vercel API トークン | [3.3 Vercel](#33-vercel) |
| `better_auth_secret` | ランダム文字列 | `openssl rand -base64 32` |
| `auth_github_id` | GitHub OAuth Client ID | [3.4 GitHub OAuth App](#34-github-oauth-app管理画面認証用) |
| `auth_github_secret` | GitHub OAuth Client Secret | [3.4 GitHub OAuth App](#34-github-oauth-app管理画面認証用) |

### 5.2 environments/production.tfvars の確認

`infra/environments/production.tfvars` にプロジェクト固有の非機密設定が入っています。  
新環境を作る場合は値を適宜変更してください:

| 変数 | 説明 | 例 |
|------|------|-----|
| `project_id` | GCP プロジェクト ID | `main-vcompute` |
| `region` | GCP リージョン | `asia-northeast1` |
| `environment` | 環境名 | `production` |
| `db_instance_name` | Cloud SQL インスタンス名 | `tut-bus-db-prod` |
| `github_org` | GitHub 組織名 | `lc-tut` |
| `github_repo` | GitHub リポジトリ名 | `tut-bus` |
| `cloudflare_zone_name` | ドメイン名 | `hekuta.net` |
| `vercel_team_id` | Vercel チーム ID | `team_xxxxx` |
| `vercel_custom_domain` | フロントエンドドメイン | `tut-bus.lcn.ad.jp` |
| `app_url_production` | 本番 URL (Better Auth 用) | `https://tut-bus.lcn.ad.jp` |
| `auth_allowed_team` | 管理者 GitHub チーム slug | `linuxclub-tut-bus` |

### 5.3 Terraform Init & Apply

```bash
cd infra

# 初期化（GCS バケットが事前作成済みであること）
terraform init

# 差分確認
terraform plan \
  -var-file=environments/production.tfvars \
  -var-file=secrets.tfvars

# 適用
terraform apply \
  -var-file=environments/production.tfvars \
  -var-file=secrets.tfvars
```

初回 apply で作成されるリソース:

| カテゴリ | リソース |
|---------|---------|
| GCP | VPC ネットワーク + サブネット |
| GCP | Cloud SQL (PostgreSQL) インスタンス + データベース |
| GCP | App Engine アプリケーション設定 |
| GCP | サービスアカウント (アプリ用 + Terraform 用) |
| GCP | Workload Identity Pool / Provider (GitHub Actions 用) |
| GCP | IAM ロールバインディング |
| GCP | 必要な API の有効化 (10+ 個) |
| Cloudflare | DNS レコード (API サブドメイン) |
| Cloudflare | SSL/TLS / HTTPS 設定 |
| Vercel | プロジェクト + 環境変数 + カスタムドメイン |

### 5.4 出力値の確認

```bash
# GitHub Actions で必要な値
terraform output github_actions_workload_identity_provider
terraform output github_actions_terraform_sa

# デプロイ情報サマリー
terraform output deployment_summary
```

---

## 6. GitHub Actions の設定

### 6.1 GitHub Variables の登録

Repository → **Settings → Secrets and variables → Actions → Variables** タブ

| 変数名 | 取得方法 | 説明 |
|--------|---------|------|
| `WIF_PROVIDER` | `terraform output -raw github_actions_workload_identity_provider` | Workload Identity Provider の完全修飾名 |
| `TERRAFORM_SA` | `terraform output -raw github_actions_terraform_sa` | Terraform 用サービスアカウントのメール |

> **注意**: Terraform で Workload Identity の名称を変更した場合は、ここも更新が必要です。

### 6.2 GitHub Secrets の登録

Repository → **Settings → Secrets and variables → Actions → Secrets** タブ

| シークレット名 | 値 | 説明 |
|---------------|-----|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン | Terraform Cloudflare provider 認証 |
| `VERCEL_API_TOKEN` | Vercel API トークン | Terraform Vercel provider 認証 |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` | Better Auth セッション暗号化 |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | 管理画面 GitHub ログイン |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret | 管理画面 GitHub ログイン |

### 6.3 GitHub Environments の設定（推奨）

`terraform-apply.yml` では `environment: production` を使用しています。  
手動承認を必須にする場合:

1. Repository → **Settings → Environments → New environment**
2. 名前: `production`
3. **Required reviewers** を有効化して承認者を追加

### 6.4 ワークフロー一覧

`.github/workflows/` に3つのワークフローがあります:

| ワークフロー | トリガー | 内容 |
|-------------|---------|------|
| `terraform-ci.yml` | `infra/**` への PR / push | `fmt -check` + `validate` の結果を PR コメント |
| `terraform-plan.yml` | `infra/**` への PR | `plan` 結果を PR コメントに投稿 |
| `terraform-apply.yml` | 手動 (workflow_dispatch) | `apply` 実行（confirm: `yes` 入力が必要） |

動作確認: `infra/` 配下のファイルを変更して PR を作成 → CI と Plan が自動実行されることを確認。

---

## 7. アプリケーションのローカル開発環境

### 7.1 依存パッケージのインストール

```bash
git clone https://github.com/lc-tut/tut-bus.git
cd tut-bus
pnpm install
```

### 7.2 Docker Compose で起動

```bash
# 全サービス起動 (web + api + db + swagger)
task up
# または: docker compose up -d

# 初回セットアップ（依存 + 起動 + マイグレーション）を一括で
task setup
```

起動するサービス:

| サービス | ポート | 説明 |
|---------|-------|------|
| web | 3000 | Next.js 開発サーバー |
| api | 8000 | Go API サーバー (Air ホットリロード) |
| db | 5432 | PostgreSQL 17 (`postgres` / `p@ssw0rd` / `tut_bus`) |
| swagger | 8080 | Swagger UI (OpenAPI ドキュメント) |

### 7.3 コード生成

API スキーマや DB クエリの変更時:

```bash
# TypeSpec → OpenAPI → TypeScript 型定義 + Go サーバーコード + sqlc
task gen:all

# 個別実行
task gen:spec           # TypeSpec → OpenAPI YAML
task gen:clients        # OpenAPI → TS 型定義 + Go サーバー
task api:sqlc:generate  # SQL クエリ → Go コード
```

### 7.4 DB マイグレーション

```bash
task api:migrate:up       # マイグレーション適用
task api:migrate:down     # 1つロールバック
task api:migrate:version  # 現在のバージョン確認
task api:db:reset         # 全リセット (down:all → up)
task api:db:seed          # シードデータ投入
```

### 7.5 Web (Next.js) 単体開発

Docker を使わずにフロントエンドだけ開発する場合:

```bash
cp apps/web/.env.example apps/web/.env
# .env の NEXT_PUBLIC_API_URL を設定 (例: http://localhost:8000)

task dev:web
# → http://localhost:3000
```

---

## 8. API の本番デプロイ (App Engine)

API は App Engine Standard (Go 1.24) にデプロイします。

```bash
cd apps/api

# デプロイ
gcloud app deploy app.yaml --project=<PROJECT_ID> --quiet

# ログ確認
gcloud app logs read --service=default --project=<PROJECT_ID>

# 状態確認
gcloud app describe --project=<PROJECT_ID>
```

### app.yaml の環境変数

`apps/api/app.yaml` に本番の環境変数が定義されています。  
DB パスワードなどの機密値は、デプロイ前に適切な値に設定してください。

| 変数 | 説明 |
|------|------|
| `DB_HOST` | Cloud SQL 接続名 (`/cloudsql/<CONNECTION_NAME>`) |
| `DB_PASSWORD` | DB パスワード |
| `CORS_ALLOWED_ORIGINS` | CORS 許可オリジン (カンマ区切り) |

---

## 9. フロントエンドの本番デプロイ (Vercel)

Vercel 設定は Terraform で管理されています。  
**`main` ブランチへの push で自動デプロイ** されます。

環境変数の変更:
- `infra/environments/production.tfvars` の Vercel 関連変数を変更 → `terraform apply`
- 緊急時: Vercel Dashboard から直接変更（次回 apply 時に上書きされるので注意）

---

## 10. 運用・トラブルシューティング

### よくある問題

| 症状 | 原因 | 対処 |
|------|------|------|
| `terraform init` で "bucket does not exist" | GCS バケット未作成 | [4.1](#41-terraform-state-用-gcs-バケットの作成) を実行 |
| GitHub Actions で "Unable to authenticate" | WIF 設定不備 | Variables の `WIF_PROVIDER`/`TERRAFORM_SA` を確認 |
| `terraform apply` で "permission denied" | IAM ロール不足 | `workload_identity.tf` のロール一覧を確認 |
| Cloudflare で "must be replaced" | Provider バージョン差 | 設定値には影響なし、apply して OK |
| Cloud SQL に接続できない | ネットワーク/認証 | VPC 設定, IP 許可リスト, Auth Proxy を確認 |
| `pnpm install` がエラー | Node.js バージョン不一致 | `node -v` が v24.x であることを確認 |

### Cloud SQL Auth Proxy（ローカルから本番 DB に接続）

```bash
# インストール
brew install cloud-sql-proxy

# 接続（terraform output で接続名を確認）
cloud-sql-proxy <PROJECT_ID>:<REGION>:<INSTANCE_NAME>
# → localhost:5432 から接続可能に
```

### ローカルで Terraform を操作

```bash
cd infra
terraform plan  -var-file=environments/production.tfvars -var-file=secrets.tfvars
terraform apply -var-file=environments/production.tfvars -var-file=secrets.tfvars
terraform output
terraform fmt -recursive
terraform validate
```

### 便利な Task コマンド一覧

```bash
task --list              # 全コマンド一覧
task setup               # 初回セットアップ (install + up + migrate)
task up / task down      # Docker 起動/停止
task gen:all             # 全コード生成
task lint / task fix     # Lint / 自動修正
task build               # 全ビルド
task api:db:shell        # PostgreSQL シェル接続
task api:migrate:up      # マイグレーション適用
task tf:plan / tf:apply  # Terraform (※ tfvars パスが古い場合あり、直接実行推奨)
```
