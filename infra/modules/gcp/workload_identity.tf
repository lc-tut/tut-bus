# ========================================
# GitHub Actions Workload Identity Federation
# ========================================

# Terraform用サービスアカウント
resource "google_service_account" "terraform" {
  account_id   = "tut-bus-terraform-sa"
  display_name = "TUT Bus Terraform Service Account"
  description  = "Service account for TUT Bus Terraform operations via GitHub Actions"
}

# Workload Identity Pool
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "tut-bus-github-pool"
  display_name              = "TUT Bus GitHub Actions Pool"
  description               = "Workload Identity Pool for TUT Bus GitHub Actions"
}

# Workload Identity Provider (GitHub OIDC)
resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "tut-bus-github-provider"
  display_name                       = "TUT Bus GitHub Provider"
  description                        = "OIDC provider for TUT Bus GitHub Actions"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
  }

  attribute_condition = "assertion.repository_owner == '${var.github_org}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# サービスアカウントとWorkload Identityのバインディング
resource "google_service_account_iam_member" "workload_identity_user" {
  service_account_id = google_service_account.terraform.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}

# ========================================
# Terraform サービスアカウントへの IAM 権限付与
# ========================================

# Project IAM Admin（IAMポリシーの管理）
resource "google_project_iam_member" "terraform_iam_admin" {
  project = var.project_id
  role    = "roles/resourcemanager.projectIamAdmin"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# Service Account Admin（サービスアカウントの管理）
resource "google_project_iam_member" "terraform_sa_admin" {
  project = var.project_id
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# Service Account User（サービスアカウントの使用）
resource "google_project_iam_member" "terraform_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# Workload Identity Pool Admin
resource "google_project_iam_member" "terraform_wip_admin" {
  project = var.project_id
  role    = "roles/iam.workloadIdentityPoolAdmin"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# Cloud SQL Admin（データベースの管理）
resource "google_project_iam_member" "terraform_sql_admin" {
  project = var.project_id
  role    = "roles/cloudsql.admin"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# Compute Network Admin（VPCの管理）
resource "google_project_iam_member" "terraform_network_admin" {
  project = var.project_id
  role    = "roles/compute.networkAdmin"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# App Engine Admin（App Engineの管理）
resource "google_project_iam_member" "terraform_appengine_admin" {
  project = var.project_id
  role    = "roles/appengine.appAdmin"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# Storage Admin（GCSバケットの管理 - Terraform state用）
resource "google_project_iam_member" "terraform_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# Service Usage Admin（API有効化の管理）
resource "google_project_iam_member" "terraform_service_usage" {
  project = var.project_id
  role    = "roles/serviceusage.serviceUsageAdmin"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

# Artifact Registry Admin
resource "google_project_iam_member" "terraform_artifact_admin" {
  project = var.project_id
  role    = "roles/artifactregistry.admin"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}
