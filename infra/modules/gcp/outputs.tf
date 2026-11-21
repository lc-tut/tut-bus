# App Engine Outputs
output "app_engine_url" {
  description = "App Engine のデフォルト URL"
  value       = "https://${var.project_id}.appspot.com"
}

output "app_engine_custom_domain" {
  description = "App Engine のカスタムドメイン"
  value       = "https://tut-bus-api.${var.zone_name}"
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


