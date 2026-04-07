# Vercelプロジェクト
resource "vercel_project" "main" {
  name      = var.project_name
  framework = var.framework
  team_id   = var.team_id

  git_repository = {
    type              = "github"
    repo              = "${var.github_org}/${var.github_repo}"
    production_branch = var.production_branch
  }

  # ビルド設定
  build_command      = var.build_command
  install_command    = var.install_command
  output_directory   = var.output_directory
  root_directory     = var.root_directory
  build_machine_type = "enhanced"

  # Production デプロイ時にカスタムドメインを自動割り当て
  auto_assign_custom_domains = true

  # Production ビルドを Preview より優先
  prioritise_production_builds = true

  # Skew Protection（有効にすると Production デプロイが Staged になり Promote が必要）
  # 不要な場合は null（未設定）にする
  skew_protection = var.skew_protection
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

# Corepack有効化（pnpm 9.x を使用するため）
resource "vercel_project_environment_variable" "enable_corepack" {
  project_id = vercel_project.main.id
  target     = ["production", "preview", "development"]
  key        = "ENABLE_EXPERIMENTAL_COREPACK"
  value      = "1"
}

# ========================================
# Announcement Banner Environment Variables
# ========================================

resource "vercel_project_environment_variable" "announcement_message" {
  count      = var.announcement_message != "" ? 1 : 0
  project_id = vercel_project.main.id
  target     = ["production", "preview"]
  key        = "NEXT_PUBLIC_ANNOUNCEMENT_MESSAGE"
  value      = var.announcement_message
}

resource "vercel_project_environment_variable" "announcement_title" {
  count      = var.announcement_message != "" ? 1 : 0
  project_id = vercel_project.main.id
  target     = ["production", "preview"]
  key        = "NEXT_PUBLIC_ANNOUNCEMENT_TITLE"
  value      = var.announcement_title
}

resource "vercel_project_environment_variable" "announcement_type" {
  count      = var.announcement_message != "" ? 1 : 0
  project_id = vercel_project.main.id
  target     = ["production", "preview"]
  key        = "NEXT_PUBLIC_ANNOUNCEMENT_TYPE"
  value      = var.announcement_type
}

resource "vercel_project_environment_variable" "announcement_link_url" {
  count      = var.announcement_link_url != "" ? 1 : 0
  project_id = vercel_project.main.id
  target     = ["production", "preview"]
  key        = "NEXT_PUBLIC_ANNOUNCEMENT_LINK_URL"
  value      = var.announcement_link_url
}

resource "vercel_project_environment_variable" "announcement_link_text" {
  count      = var.announcement_link_text != "" ? 1 : 0
  project_id = vercel_project.main.id
  target     = ["production", "preview"]
  key        = "NEXT_PUBLIC_ANNOUNCEMENT_LINK_TEXT"
  value      = var.announcement_link_text
}

# Google Analytics
resource "vercel_project_environment_variable" "ga_id" {
  count      = var.ga_id != "" ? 1 : 0
  project_id = vercel_project.main.id
  target     = ["production"]
  key        = "NEXT_PUBLIC_GA_ID"
  value      = var.ga_id
}

# ========================================
# Better Auth Environment Variables
# ========================================

# アプリURL - Production
resource "vercel_project_environment_variable" "app_url_production" {
  project_id = vercel_project.main.id
  target     = ["production"]
  key        = "NEXT_PUBLIC_APP_URL"
  value      = var.app_url_production
}

# アプリURL - Preview
resource "vercel_project_environment_variable" "app_url_preview" {
  count      = var.app_url_preview != "" ? 1 : 0
  project_id = vercel_project.main.id
  target     = ["preview"]
  key        = "NEXT_PUBLIC_APP_URL"
  value      = var.app_url_preview
}

# Better Auth Secret
resource "vercel_project_environment_variable" "better_auth_secret" {
  project_id = vercel_project.main.id
  target     = ["production", "preview"]
  key        = "BETTER_AUTH_SECRET"
  value      = var.better_auth_secret
  sensitive  = true
}

# GitHub OAuth - Client ID
resource "vercel_project_environment_variable" "auth_github_id" {
  project_id = vercel_project.main.id
  target     = ["production", "preview"]
  key        = "AUTH_GITHUB_ID"
  value      = var.auth_github_id
}

# GitHub OAuth - Client Secret
resource "vercel_project_environment_variable" "auth_github_secret" {
  project_id = vercel_project.main.id
  target     = ["production", "preview"]
  key        = "AUTH_GITHUB_SECRET"
  value      = var.auth_github_secret
  sensitive  = true
}

# Allowed Team（オプション）
resource "vercel_project_environment_variable" "auth_allowed_team" {
  count      = var.auth_allowed_team != "" ? 1 : 0
  project_id = vercel_project.main.id
  target     = ["production", "preview"]
  key        = "AUTH_ALLOWED_TEAM"
  value      = var.auth_allowed_team
}

# カスタムドメイン（オプション）
resource "vercel_project_domain" "custom_domain" {
  count      = var.custom_domain != "" ? 1 : 0
  project_id = vercel_project.main.id
  domain     = var.custom_domain
}

# Vercelのデフォルトドメインからカスタムドメインへのリダイレクト
resource "vercel_project_domain" "vercel_app_redirect" {
  count                = var.custom_domain != "" ? 1 : 0
  project_id           = vercel_project.main.id
  domain               = "${var.project_name}.vercel.app"
  redirect             = var.custom_domain
  redirect_status_code = 308
}

# 追加ドメインからメインドメインへのリダイレクト
resource "vercel_project_domain" "redirect_domains" {
  for_each             = toset(var.redirect_domains)
  project_id           = vercel_project.main.id
  domain               = each.value
  redirect             = var.custom_domain
  redirect_status_code = 308
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
