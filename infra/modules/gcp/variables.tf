# Project Configuration
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

# Application Configuration
variable "cors_allowed_origins" {
  description = "CORSで許可するオリジン（Vercelのドメイン）"
  type        = string
}

# GitHub Configuration for Workload Identity
variable "github_org" {
  description = "GitHubの組織名またはユーザー名"
  type        = string
}

variable "github_repo" {
  description = "GitHubリポジトリ名"
  type        = string
}
