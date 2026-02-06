variable "zone_name" {
  description = "Cloudflareゾーン名（ドメイン名）"
  type        = string
}

variable "api_record_name" {
  description = "APIのサブドメイン名"
  type        = string
  default     = "tut-bus-api"
}

variable "web_record_name" {
  description = "Webのサブドメイン名（Vercel用）"
  type        = string
  default     = "tut-bus"
}

variable "proxied" {
  description = "Cloudflare Proxyを有効化（DDoS保護、SSL/TLS）"
  type        = bool
  default     = true
}

variable "ssl_mode" {
  description = "SSL/TLS暗号化モード（flexible, full, strict）"
  type        = string
  default     = "flexible"

  validation {
    condition     = contains(["flexible", "full", "strict", "off"], var.ssl_mode)
    error_message = "ssl_modeはflexible, full, strict, offのいずれかである必要があります。"
  }
}

variable "min_tls_version" {
  description = "最小TLSバージョン"
  type        = string
  default     = "1.2"

  validation {
    condition     = contains(["1.0", "1.1", "1.2", "1.3"], var.min_tls_version)
    error_message = "min_tls_versionは1.0, 1.1, 1.2, 1.3のいずれかである必要があります。"
  }
}
