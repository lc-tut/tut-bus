# TUT Bus Infrastructure - Root Module

# GCPモジュール
module "gcp" {
  source = "./modules/gcp"

  # Project Configuration
  project_id  = var.project_id
  region      = var.region
  zone        = var.zone
  environment = var.environment

  # Database Configuration
  db_instance_name = var.db_instance_name
  db_name          = var.db_name
  db_tier          = var.db_tier

  # Application Configuration
  cors_allowed_origins = var.cors_allowed_origins

  # App Engine Configuration
  zone_name = var.cloudflare_zone_name
}

# Cloudflareモジュール
module "cloudflare" {
  source = "./modules/cloudflare"

  zone_name       = var.cloudflare_zone_name
  api_record_name = var.cloudflare_api_record_name
  web_record_name = "tut-bus"

  # SSL/TLS Configuration
  ssl_mode        = var.cloudflare_ssl_mode
  min_tls_version = var.cloudflare_min_tls_version
  proxied         = var.cloudflare_proxied

  depends_on = [module.gcp]
}

# Vercelモジュール
module "vercel" {
  source = "./modules/vercel"

  # Project Configuration
  project_name = var.vercel_project_name
  framework    = var.vercel_framework
  team_id      = var.vercel_team_id

  # GitHub Configuration
  github_org  = var.github_org
  github_repo = var.github_repo

  # Deployment Configuration
  production_branch = var.vercel_production_branch
  custom_domain     = var.vercel_custom_domain
  redirect_domains  = var.vercel_redirect_domains
  root_directory    = "apps/web"

  # API URLs
  api_url_production  = "https://${module.cloudflare.api_record_hostname}"
  api_url_preview     = "https://${module.cloudflare.api_record_hostname}"
  api_url_development = var.vercel_dev_api_url

  # Build Configuration
  build_command    = var.vercel_build_command
  install_command  = var.vercel_install_command
  output_directory = var.vercel_output_directory

  # Deployment Retention
  enable_deployment_retention = var.vercel_enable_deployment_retention

  # Announcement Banner
  announcement_message   = var.vercel_announcement_message
  announcement_title     = var.vercel_announcement_title
  announcement_type      = var.vercel_announcement_type
  announcement_link_url  = var.vercel_announcement_link_url
  announcement_link_text = var.vercel_announcement_link_text

  # Google Analytics
  ga_id = var.vercel_ga_id

  # Better Auth Configuration
  app_url_production = var.app_url_production
  app_url_preview    = var.app_url_preview
  better_auth_secret = var.better_auth_secret
  auth_github_id     = var.auth_github_id
  auth_github_secret = var.auth_github_secret
  auth_allowed_team  = var.auth_allowed_team

  depends_on = [module.cloudflare]
}
