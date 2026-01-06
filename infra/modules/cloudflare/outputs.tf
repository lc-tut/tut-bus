output "zone_id" {
  description = "Cloudflare Zone ID"
  value       = data.cloudflare_zone.main.id
}

output "zone_name" {
  description = "Cloudflareゾーン名"
  value       = data.cloudflare_zone.main.name
}

output "api_record_id" {
  description = "APIのDNSレコードID"
  value       = cloudflare_dns_record.api.id
}

output "api_record_hostname" {
  description = "APIの完全修飾ドメイン名"
  value       = "${cloudflare_dns_record.api.name}.${var.zone_name}"
}

output "api_record_value" {
  description = "API DNSレコードの値"
  value       = cloudflare_dns_record.api.content
}
