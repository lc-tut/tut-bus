# App Engine Outputs
output "app_engine_url" {
  description = "App Engine のデフォルト URL"
  value       = "https://${var.project_id}.appspot.com"
}

output "app_engine_custom_domain" {
  description = "App Engine のカスタムドメイン"
  value       = "https://tut-bus-api.${var.zone_name}"
}

# Database Outputs
output "db_instance_name" {
  description = "Cloud SQLインスタンス名"
  value       = google_sql_database_instance.main.name
}

output "db_public_ip" {
  description = "Cloud SQLインスタンスのパブリックIP"
  value       = google_sql_database_instance.main.public_ip_address
}

output "db_connection_name" {
  description = "Cloud SQLインスタンスの接続名"
  value       = google_sql_database_instance.main.connection_name
}

# Network Outputs
output "network_name" {
  description = "VPCネットワーク名"
  value       = google_compute_network.main.name
}

output "subnet_name" {
  description = "サブネット名"
  value       = google_compute_subnetwork.main.name
}

# IAM Outputs
output "service_account_email" {
  description = "サービスアカウントのメールアドレス"
  value       = google_service_account.main.email
}

# Workload Identity Outputs
output "terraform_service_account_email" {
  description = "Terraform用サービスアカウントのメールアドレス"
  value       = google_service_account.terraform.email
}

output "workload_identity_pool_name" {
  description = "Workload Identity Pool名"
  value       = google_iam_workload_identity_pool.github.name
}

output "workload_identity_provider_name" {
  description = "Workload Identity Provider名"
  value       = google_iam_workload_identity_pool_provider.github.name
}

# Storage Outputs
output "terraform_state_bucket" {
  description = "Terraform state用GCSバケット名"
  value       = google_storage_bucket.terraform_state.name
}
