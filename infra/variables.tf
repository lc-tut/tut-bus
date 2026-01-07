# ========================================
# GCP Variables
# ========================================

# ========================================
# Provider API Tokens
# ========================================

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "vercel_api_token" {
  description = "Vercel API Token"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel Team ID（オプション）"
  type        = string
  default     = null
}

# ========================================
# GCP Variables
# ========================================

variable "project_id" {
  description = "GCPプロジェクトID"
  type        = string
}

variable "region" {
  description = "デプロイするリージョン"
  type        = string
  default     = "asia-northeast1"
}

variable "zone" {
  description = "デプロイするゾーン"
  type        = string
  default     = "asia-northeast1-a"
}

variable "environment" {
  description = "環境名（dev, staging, production）"
  type        = string
  default     = "dev"
}

# Database Configuration
variable "db_instance_name" {
  description = "Cloud SQLインスタンス名"
  type        = string
}

variable "db_name" {
  description = "データベース名"
  type        = string
  default     = "tutbus"
}

variable "db_tier" {
  description = "Cloud SQLのインスタンスタイプ"
  type        = string
  default     = "db-f1-micro"
}

# Application Configuration
variable "cors_allowed_origins" {
  description = "CORSで許可するオリジン（Vercelのドメイン）"
  type        = string
  default     = "https://tut-bus-web.vercel.app"
}

# ========================================
# Cloudflare Variables
# ========================================

variable "cloudflare_zone_name" {
  description = "Cloudflareゾーン名（ドメイン名）"
  type        = string
}

variable "cloudflare_api_record_name" {
  description = "APIのサブドメイン名"
  type        = string
  default     = "tut-bus-api"
}

variable "cloudflare_proxied" {
  description = "Cloudflare Proxyを有効化（DDoS保護、SSL/TLS）"
  type        = bool
  default     = true
}

variable "cloudflare_ssl_mode" {
  description = "SSL/TLS暗号化モード（flexible, full, strict）"
  type        = string
  default     = "flexible"
}

variable "cloudflare_min_tls_version" {
  description = "最小TLSバージョン"
  type        = string
  default     = "1.2"
}

# ========================================
# Vercel Variables
# ========================================

variable "vercel_project_name" {
  description = "Vercelプロジェクト名"
  type        = string
  default     = "tut-bus-web"
}

variable "vercel_framework" {
  description = "フレームワーク名"
  type        = string
  default     = "nextjs"
}

variable "github_org" {
  description = "GitHubオーガニゼーション/ユーザー名"
  type        = string
}

variable "github_repo" {
  description = "GitHubリポジトリ名"
  type        = string
}

variable "vercel_production_branch" {
  description = "本番環境のブランチ名"
  type        = string
  default     = "main"
}

variable "vercel_custom_domain" {
  description = "カスタムドメイン名（オプション）"
  type        = string
  default     = ""
}

variable "vercel_dev_api_url" {
  description = "開発環境のAPI URL"
  type        = string
  default     = "http://localhost:8000"
}

variable "vercel_build_command" {
  description = "ビルドコマンド"
  type        = string
  default     = "pnpm run build"
}

variable "vercel_install_command" {
  description = "インストールコマンド"
  type        = string
  default     = "pnpm install"
}

variable "vercel_output_directory" {
  description = "出力ディレクトリ"
  type        = string
  default     = ".next"
}

variable "vercel_enable_deployment_retention" {
  description = "デプロイメント保持を有効化"
  type        = bool
  default     = true
}

# ========================================
# Vercel Announcement Banner Variables
# ========================================

variable "vercel_announcement_message" {
  description = "アナウンスメントバナーのメッセージ（空の場合は表示しない）"
  type        = string
  default     = ""
}

variable "vercel_announcement_title" {
  description = "アナウンスメントバナーのタイトル"
  type        = string
  default     = "お知らせ"
}

variable "vercel_announcement_type" {
  description = "アナウンスメントバナーのタイプ（info / warning）"
  type        = string
  default     = "info"
}

variable "vercel_announcement_link_url" {
  description = "アナウンスメントバナーのリンクURL"
  type        = string
  default     = ""
}

variable "vercel_announcement_link_text" {
  description = "アナウンスメントバナーのリンクテキスト"
  type        = string
  default     = ""
}

variable "vercel_ga_id" {
  description = "Google Analytics ID"
  type        = string
  default     = ""
}
