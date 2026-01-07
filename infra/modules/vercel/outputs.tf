output "project_id" {
  description = "VercelプロジェクトID"
  value       = vercel_project.main.id
}

output "project_name" {
  description = "Vercelプロジェクト名"
  value       = vercel_project.main.name
}

output "project_framework" {
  description = "フレームワーク名"
  value       = vercel_project.main.framework
}

output "git_repository" {
  description = "GitHubリポジトリ"
  value       = vercel_project.main.git_repository
}

output "custom_domain" {
  description = "カスタムドメイン"
  value       = var.custom_domain != "" ? vercel_project_domain.custom_domain[0].domain : null
}
