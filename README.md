# 時刻表Webアプリ - バスNavi

![表紙](https://github.com/user-attachments/assets/e4583b4d-9576-4ba9-964b-ea984356c804)

## 製品概要

バスNaviは運行時間を出発地ごとに現在時刻から近いバスの時刻を一覧表示する

### 背景(製品開発のきっかけ、課題など)

弊学のHPにて掲載されている時刻表が読みづらいことやスクールバスの待機列が利用者から不明確なために<br>待機時間が長くなり、講義に間に合いにくいなど不満が多いのがきっかけとなった。
![行列の画像](https://github.com/user-attachments/assets/fe85ea52-8262-4af8-9733-a1b1a64c61e7)

### 製品説明(具体的な製品の説明)

ホーム画面、時刻表の検索画面、設定の入力画面の3画面がある。<br>ホーム画面には大学と各目的地(八王子駅・八王子みなみ野駅・学生会館)それぞれを起点とする現在時刻から近いバスの出発時刻が<br>一覧表示されている。<br>時刻表の検索画面では利用者が求めているバスの時刻を絞り込み表示できる。<br>設定の入力画面には表示テーマの設定やプロフィール設定などが行える。<br>
<img width="143" alt="ホーム画面" src="https://github.com/user-attachments/assets/bfd1d0e2-6fac-4252-8b4a-3d73e542e501" />
![検索画面](https://github.com/user-attachments/assets/f5704ae2-4942-4382-a42c-49c8c7250854)
<img width="147" alt="設定画面" src="https://github.com/user-attachments/assets/96f15005-61a1-4d37-8da3-c425ee46cf76" />

### 特長

#### 1. 特長1 現在時刻から次来るバスの時刻を複数本一覧表示

#### 2. 特長2 横にスライドするだけで各出発地を変更可能

#### 3. 特長3 日付・出発地・目的地・時間帯を任意で入力し利用者が求めているバスの時刻を一覧表示

### 解決できること

- 東京工科大学のホームページを経由せず最短で時刻表を閲覧できる
- 直感的に出発時刻や到着時刻を閲覧できる

### 今後の展望

- 利用者の位置情報を取得して利用者の位置情報から近い出発地点から次来るバスの出発時刻までの時間を通知する
- 時刻表の検索機能でバス停を中継した選択が表示されるようにする
- バスの時刻表にOGPを設定する etc...

### 注力したこと(こだわりなど)

- 開発するきっかけにもあった時刻表のUI

## 開発内容・開発技術

### 使用言語

TypeScript, Go, Typespec

### フレームワーク・ライブラリ・モジュール

- Next.js
- Tailwind
- Echo

### デバイス

- Android
- iPhone
- Web Browser

#### ハッカソンで開発した独自機能・技術

- ホーム画面のUI

## デプロイ

### アーキテクチャ

- **Vercel**: フロントエンド (Next.js) のホスティング
- **App Engine Standard**: API (Go) アプリケーションの実行
- **Cloud SQL (PostgreSQL)**: データベース
- **VPC Network**: プライベートネットワーク
- **Cloudflare**: DNS + SSL/TLS + DDoS Protection

### デプロイ手順

詳細は [infra/README.md](infra/README.md) を参照してください。

#### 1. App Engine にアプリケーションをデプロイ

```bash
cd apps/api
gcloud app deploy app.yaml --project=YOUR_PROJECT_ID --quiet
```

#### 2. インフラのプロビジョニング (Terraform)

```bash
cd infra
terraform init
terraform apply -var-file=production.tfvars
```

#### 3. フロントエンド (Vercel)

Vercelにプロジェクトをデプロイし、`main`ブランチにプッシュすることで自動デプロイされます。

環境変数：
```
NEXT_PUBLIC_API_URL=https://tut-bus-api.hekuta.net
```

### 運用コマンド

```bash
# ログの確認
gcloud app logs read --service=default --project=YOUR_PROJECT_ID

# アプリケーションの状態確認
gcloud app describe --project=YOUR_PROJECT_ID
```
