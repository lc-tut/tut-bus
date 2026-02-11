# サービスアカウント
resource "google_service_account" "main" {
  account_id   = "tut-bus-app-sa"
  display_name = "TUT Bus Application Service Account"
}

# Cloud SQLクライアント権限
resource "google_project_iam_member" "sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Cloud SQL IAM認証権限（IAM Database Userとしてログインするために必要）
resource "google_project_iam_member" "sql_instance_user" {
  project = var.project_id
  role    = "roles/cloudsql.instanceUser"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Storage Viewer権限
resource "google_project_iam_member" "storage_viewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Logging Writer権限
resource "google_project_iam_member" "logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Monitoring Metric Writer権限
resource "google_project_iam_member" "monitoring_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Compute Network User権限（Cloud Run Job の Direct VPC Egress に必要）
# プロジェクトレベルではなくサブネットに限定し最小権限を遵守
resource "google_compute_subnetwork_iam_member" "cloud_run_network_user" {
  project    = var.project_id
  region     = var.region
  subnetwork = google_compute_subnetwork.main.name
  role       = "roles/compute.networkUser"
  member     = "serviceAccount:${google_service_account.main.email}"
}

# Container Registry Reader権限
resource "google_project_iam_member" "artifact_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.main.email}"
}
