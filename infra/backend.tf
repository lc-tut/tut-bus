# ========================================
# Terraform Backend Configuration
# ========================================

terraform {
  backend "gcs" {
    bucket = "tut-bus-terraform-state"
    prefix = "terraform/state"
  }
}
