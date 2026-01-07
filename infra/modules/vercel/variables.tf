variable "project_name" {
  description = "Vercelプロジェクト名"
  type        = string
  default     = "tut-bus-web"
}

variable "framework" {
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

variable "team_id" {
  description = "Vercel Team ID（オプション）"
  type        = string
  default     = null
}

variable "production_branch" {
  description = "本番環境のブランチ名"
  type        = string
  default     = "main"
}

variable "custom_domain" {
  description = "カスタムドメイン名（オプション）"
  type        = string
  default     = ""
}

variable "api_url_production" {
  description = "本番環境のAPI URL"
  type        = string
}

variable "api_url_preview" {
  description = "プレビュー環境のAPI URL"
  type        = string
}

variable "api_url_development" {
  description = "開発環境のAPI URL"
  type        = string
  default     = "http://localhost:8000"
}

variable "build_command" {
  description = "ビルドコマンド"
  type        = string
  default     = "pnpm run build"
}

variable "install_command" {
  description = "インストールコマンド"
  type        = string
  default     = "pnpm install --frozen-lockfile"
}

variable "output_directory" {
  description = "出力ディレクトリ"
  type        = string
  default     = ".next"
}

variable "root_directory" {
  description = "プロジェクトのルートディレクトリ（monorepo用）"
  type        = string
  default     = null
}

variable "enable_deployment_retention" {
  description = "デプロイメント保持を有効化"
  type        = bool
  default     = true
}

# ========================================
# Announcement Banner Variables
# ========================================

variable "announcement_message" {
  description = "アナウンスメントバナーのメッセージ（空の場合は表示しない）"
  type        = string
  default     = ""
}

variable "announcement_title" {
  description = "アナウンスメントバナーのタイトル"
  type        = string
  default     = "お知らせ"
}

variable "announcement_type" {
  description = "アナウンスメントバナーのタイプ（info / warning）"
  type        = string
  default     = "info"
}

variable "announcement_link_url" {
  description = "アナウンスメントバナーのリンクURL"
  type        = string
  default     = ""
}

variable "announcement_link_text" {
  description = "アナウンスメントバナーのリンクテキスト"
  type        = string
  default     = ""
}

variable "ga_id" {
  description = "Google Analytics ID"
  type        = string
  default     = ""
}
