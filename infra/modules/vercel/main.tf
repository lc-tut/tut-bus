# Vercelプロジェクト
resource "vercel_project" "main" {
  name      = var.project_name
  framework = var.framework

  git_repository = {
    type              = "github"
    repo              = "${var.github_org}/${var.github_repo}"
    production_branch = var.production_branch
  }

  # ビルド設定
  build_command    = var.build_command
  install_command  = var.install_command
  output_directory = var.output_directory
  root_directory   = var.root_directory
}

# 環境変数 - Production
resource "vercel_project_environment_variable" "api_url_production" {
  project_id = vercel_project.main.id
  target     = ["production"]
  key        = "NEXT_PUBLIC_API_URL"
  value      = var.api_url_production
}

# 環境変数 - Preview
resource "vercel_project_environment_variable" "api_url_preview" {
  project_id = vercel_project.main.id
  target     = ["preview"]
  key        = "NEXT_PUBLIC_API_URL"
  value      = var.api_url_preview
}

# 環境変数 - Development
resource "vercel_project_environment_variable" "api_url_development" {
  project_id = vercel_project.main.id
  target     = ["development"]
  key        = "NEXT_PUBLIC_API_URL"
  value      = var.api_url_development
}

# カスタムドメイン（オプション）
resource "vercel_project_domain" "custom_domain" {
  count      = var.custom_domain != "" ? 1 : 0
  project_id = vercel_project.main.id
  domain     = var.custom_domain
}

# デプロイメント保持期間（オプション）
resource "vercel_project_deployment_retention" "main" {
  count                 = var.enable_deployment_retention ? 1 : 0
  project_id            = vercel_project.main.id
  team_id               = var.team_id
  expiration_preview    = "3m"
  expiration_production = "1y"
  expiration_canceled   = "1m"
  expiration_errored    = "2m"
}
