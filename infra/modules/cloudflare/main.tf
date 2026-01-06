#CloudflareゾーンのデータソースでZone IDを取得
data "cloudflare_zone" "main" {
  filter = {
    name = var.zone_name
  }
}

# APIのCNAMEレコード (App Engine用)
resource "cloudflare_dns_record" "api" {
  zone_id = data.cloudflare_zone.main.id
  name    = var.api_record_name
  type    = "CNAME"
  content = "ghs.googlehosted.com" # App Engine のデフォルトターゲット
  ttl     = 1                      # Auto
  proxied = var.proxied            # Cloudflare Proxyを有効化（DDoS保護、SSL/TLS）

  comment = "App Engine カスタムドメイン用 CNAME"
}

# Cloudflare SSL/TLS設定
resource "cloudflare_zone_setting" "ssl" {
  zone_id    = data.cloudflare_zone.main.id
  setting_id = "ssl"
  value      = var.ssl_mode
}

resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = data.cloudflare_zone.main.id
  setting_id = "always_use_https"
  value      = "on"
}

resource "cloudflare_zone_setting" "min_tls_version" {
  zone_id    = data.cloudflare_zone.main.id
  setting_id = "min_tls_version"
  value      = var.min_tls_version
}

resource "cloudflare_zone_setting" "http3" {
  zone_id    = data.cloudflare_zone.main.id
  setting_id = "http3"
  value      = "on"
}

resource "cloudflare_zone_setting" "tls_1_3" {
  zone_id    = data.cloudflare_zone.main.id
  setting_id = "tls_1_3"
  value      = "on"
}
