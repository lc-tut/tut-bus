# App Engine Application
resource "google_app_engine_application" "main" {
  project       = var.project_id
  location_id   = var.region
  database_type = "CLOUD_DATASTORE_COMPATIBILITY"

  depends_on = [
    google_project_service.compute,
    google_project_service.appengine
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

resource "null_resource" "app_engine_config_rollout" {
  triggers = {
    project_id           = var.project_id
    cors_allowed_origins = var.cors_allowed_origins
    db_instance_name     = var.db_instance_name
    region               = var.region
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]

    command = <<-EOT
      set -euo pipefail

      APP_DIR="${path.module}/../../../apps/api"
      cd "$APP_DIR"
      TMP_FILE="$(mktemp ./app.XXXXXX.yaml)"
      trap 'rm -f "$TMP_FILE"' EXIT

      cat > "$TMP_FILE" <<'EOF'
      runtime: go124
      service: default

      env_variables:
        API_ENV: 'production'
        HOST: '0.0.0.0'
        DB_NAME: 'tutbus'
        DB_USER: 'postgres'
        DB_HOST: '/cloudsql/${var.project_id}:${var.region}:${var.db_instance_name}'
        DB_PORT: ''
        DB_PASSWORD: ''
        DB_SSLMODE: 'disable'
        DATA_PATH: './data'
        CORS_ALLOWED_ORIGINS: '${var.cors_allowed_origins}'

      instance_class: F1

      automatic_scaling:
        min_instances: 1
        max_instances: 2
        min_idle_instances: 1
        max_idle_instances: 1
        target_cpu_utilization: 0.8
        target_throughput_utilization: 0.8
      EOF

      gcloud app deploy "$TMP_FILE" --project="${var.project_id}" --quiet
    EOT
  }

  depends_on = [
    google_app_engine_application.main
  ]
}
