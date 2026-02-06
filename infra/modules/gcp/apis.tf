# 必要なGCP APIを有効化
resource "google_project_service" "compute" {
  project = var.project_id
  service = "compute.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "sqladmin" {
  project = var.project_id
  service = "sqladmin.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "servicenetworking" {
  project = var.project_id
  service = "servicenetworking.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "cloudresourcemanager" {
  project = var.project_id
  service = "cloudresourcemanager.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "iam" {
  project = var.project_id
  service = "iam.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "logging" {
  project = var.project_id
  service = "logging.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "monitoring" {
  project = var.project_id
  service = "monitoring.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry" {
  project = var.project_id
  service = "artifactregistry.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "storage" {
  project = var.project_id
  service = "storage.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "iamcredentials" {
  project = var.project_id
  service = "iamcredentials.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "appengine" {
  project = var.project_id
  service = "appengine.googleapis.com"

  disable_on_destroy = false
}
