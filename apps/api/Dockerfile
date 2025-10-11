# Dockerfile
FROM golang:1.25-alpine

WORKDIR /app

# go.modとgo.sumをコピーして依存関係をダウンロード
COPY go.mod go.sum ./
RUN go mod download

# airをインストール
RUN go install github.com/air-verse/air@latest

# アプリケーションコードをコピー
COPY . .

# airを実行
CMD ["air", "-c", ".air.toml"]
