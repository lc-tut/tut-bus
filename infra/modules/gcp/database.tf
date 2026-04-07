# Cloud SQL Instance (Private IP)
resource "google_sql_database_instance" "main" {
  name             = var.db_instance_name
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_autoresize   = false
    disk_size         = 10

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.main.id
      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled                        = var.environment == "production"
      start_time                     = "03:00"
      point_in_time_recovery_enabled = false
      transaction_log_retention_days = 1
    }

    maintenance_window {
      day  = 7
      hour = 4
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }
  }

  deletion_protection = false

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [
    google_project_service.sqladmin,
    google_service_networking_connection.private_vpc_connection
  ]
}

resource "google_sql_database" "main" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

# IAM Database User (パスワード不要)
resource "google_sql_user" "iam_user" {
  name     = trimsuffix(google_service_account.main.email, ".gserviceaccount.com")
  instance = google_sql_database_instance.main.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}
