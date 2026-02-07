# ========================================
# TUT Bus Infrastructure - Production Configuration
# ========================================
# 
# 機密情報は含まれていません。
# 機密情報（APIトークン等）は以下の環境変数で設定してください：
#   - TF_VAR_cloudflare_api_token
#   - TF_VAR_vercel_api_token
#   - TF_VAR_better_auth_secret
#   - TF_VAR_auth_github_id
#   - TF_VAR_auth_github_secret
#
# GitHub Actionsでは、これらはGitHub Secretsから自動的に設定されます。
# ========================================

# ========================================
# GCP
# ========================================
project_id       = "main-vcompute"
region           = "asia-northeast1"
zone             = "asia-northeast1-a"
environment      = "production"
db_instance_name = "tut-bus-db-prod"
db_tier          = "db-f1-micro"

# Application Configuration
cors_allowed_origins = "https://tut-bus.hekuta.net,https://tut-bus.lcn.ad.jp"

# ========================================
# Cloudflare
# ========================================
cloudflare_zone_name       = "hekuta.net"
cloudflare_api_record_name = "tut-bus-api"
cloudflare_ssl_mode        = "strict"
cloudflare_min_tls_version = "1.2"

# ========================================
# Vercel
# ========================================
vercel_team_id           = "team_kIKSNppKX4A6hEGHw7pLgbPV"
github_org               = "lc-tut"
github_repo              = "tut-bus"
vercel_project_name      = "tut-bus-web"
vercel_production_branch = "main"
vercel_custom_domain     = "tut-bus.lcn.ad.jp"
vercel_redirect_domains  = ["tut-bus.hekuta.net"]

# ========================================
# Announcement Banner (optional)
# ========================================
vercel_announcement_message   = "年末年始の臨時ダイヤが多く、時刻表更新が追いついておりません。掲載されているのは通常ダイヤのみです。実際の運行状況は、バス停の掲示または公式サイトをご確認ください。"
vercel_announcement_title     = "時刻表更新について"
vercel_announcement_type      = "warning"
vercel_announcement_link_url  = "https://www.teu.ac.jp/campus/access/index.html"
vercel_announcement_link_text = "公式サイトで確認"

# Google Analytics (optional)
vercel_ga_id = "G-KGNFQE7DZ3"

# ========================================
# Better Auth (管理画面認証)
# ========================================
app_url_production = "https://tut-bus.lcn.ad.jp"
auth_allowed_team  = "linuxclub-tut-bus"
