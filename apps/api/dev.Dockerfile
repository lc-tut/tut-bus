# Development Dockerfile with hot reload
FROM golang:1.24-alpine

WORKDIR /app

# Install build dependencies and air for hot reload
RUN apk add --no-cache git make curl && \
    go install github.com/air-verse/air@v1.61.7

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

EXPOSE 8000

CMD ["air", "-c", ".air.toml"]
