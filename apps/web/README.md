# TUT Bus Web Frontend

東京工科大学のスクールバス時刻表Webアプリケーションのフロントエンド。

## 技術スタック

- **Next.js 14** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/ui** (UIコンポーネント)
- **openapi-fetch** (型安全なAPIクライアント)

## 開発環境のセットアップ

```bash
# 依存関係のインストール（ワークスペースルートから）
cd /path/to/tut-bus
pnpm install

# 開発サーバーの起動
pnpm dev:web
# または
cd apps/web
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 環境変数

`.env.local` に以下を設定：

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # ローカル開発時
# または
NEXT_PUBLIC_API_URL=https://tut-bus-api.hekuta.net  # 本番API
```

## ビルド

```bash
pnpm build:web
```

## デプロイ

Vercel にデプロイされます。`main` ブランチへのプッシュで自動デプロイ。

## 主な機能

- 現在時刻から次のバスを表示
- 出発地・目的地別の時刻表検索
- レスポンシブデザイン（スマホ・PC対応）
- ダークモード対応
