# ========================================
# Terraform Backend Configuration
# ========================================

terraform {
  # NOTE: backend ブロックでは変数が使えないため、バケット名はハードコード
  # バケットは Terraform 管理外（bootstrap で手動作成）
  # 初回セットアップ手順は docs/bootstrap.md を参照
  backend "gcs" {
    bucket = "tut-bus-terraform-state"
    prefix = "terraform/state"
  }
}
