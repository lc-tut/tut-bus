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
}
