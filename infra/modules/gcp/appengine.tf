# App Engine Application
resource "google_app_engine_application" "main" {
  project       = var.project_id
  location_id   = var.region
  database_type = "CLOUD_DATASTORE_COMPATIBILITY"

  depends_on = [
    google_project_service.compute
  ]
}

# App Engine カスタムドメイン
resource "google_app_engine_domain_mapping" "main" {
  domain_name = "tut-bus-api.${var.zone_name}"

  ssl_settings {
    ssl_management_type = "AUTOMATIC"
  }

  depends_on = [
    google_app_engine_application.main
  ]
}
