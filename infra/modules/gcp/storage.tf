# ========================================
# Terraform State Storage
# ========================================

# Terraform state用GCSバケット
resource "google_storage_bucket" "terraform_state" {
  name     = "tut-bus-terraform-state"
  location = var.region
  project  = var.project_id

  # バージョニング有効化（state破損時のリカバリ用）
  versioning {
    enabled = true
  }

  # 均一なバケットレベルアクセス
  uniform_bucket_level_access = true

  # パブリックアクセス防止
  public_access_prevention = "enforced"

  # ライフサイクルルール（古いバージョンを90日後に削除）
  lifecycle_rule {
    condition {
      num_newer_versions = 5
      with_state         = "ARCHIVED"
    }
    action {
      type = "Delete"
    }
  }

  # 誤削除防止
  lifecycle {
    prevent_destroy = true
  }

  labels = {
    environment = var.environment
    purpose     = "terraform-state"
    managed-by  = "terraform"
  }

  depends_on = [google_project_service.storage]
}

resource "google_storage_bucket_iam_member" "terraform_state_admin" {
  bucket = google_storage_bucket.terraform_state.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.terraform.email}"
}
