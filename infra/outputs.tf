# ========================================
# GCP Outputs
# ========================================

output "gcp_db_instance_name" {
  description = "Cloud SQLインスタンス名"
  value       = module.gcp.db_instance_name
}

output "gcp_db_public_ip" {
  description = "Cloud SQLインスタンスのパブリックIP"
  value       = module.gcp.db_public_ip
}

output "gcp_db_connection_name" {
  description = "Cloud SQLインスタンスの接続名"
  value       = module.gcp.db_connection_name
}

output "gcp_network_name" {
  description = "VPCネットワーク名"
  value       = module.gcp.network_name
}

output "gcp_subnet_name" {
  description = "サブネット名"
  value       = module.gcp.subnet_name
}

output "gcp_service_account_email" {
  description = "サービスアカウントのメールアドレス"
  value       = module.gcp.service_account_email
}

# ========================================
# Cloudflare Outputs
# ========================================

output "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  value       = module.cloudflare.zone_id
}

output "cloudflare_zone_name" {
  description = "Cloudflareゾーン名"
  value       = module.cloudflare.zone_name
}

output "cloudflare_api_record_id" {
  description = "APIのDNSレコードID"
  value       = module.cloudflare.api_record_id
}

output "cloudflare_api_hostname" {
  description = "APIのホスト名"
  value       = module.cloudflare.api_record_hostname
}

output "cloudflare_api_ip" {
  description = "APIのDNSレコード値（IPアドレス）"
  value       = module.cloudflare.api_record_value
}

# ========================================
# Vercel Outputs
# ========================================

output "vercel_project_id" {
  description = "VercelプロジェクトID"
  value       = module.vercel.project_id
}

output "vercel_project_name" {
  description = "Vercelプロジェクト名"
  value       = module.vercel.project_name
}

output "vercel_project_framework" {
  description = "フレームワーク名"
  value       = module.vercel.project_framework
}

output "vercel_custom_domain" {
  description = "カスタムドメイン"
  value       = module.vercel.custom_domain
}

# ========================================
# Summary
# ========================================

output "deployment_summary" {
  description = "デプロイメント情報のサマリー"
  value = {
    api_url     = "https://${module.cloudflare.api_record_hostname}"
    web_url     = var.vercel_custom_domain != "" ? "https://${var.vercel_custom_domain}" : "Vercel default domain"
    environment = var.environment
    region      = var.region
    project_id  = var.project_id
  }
}
