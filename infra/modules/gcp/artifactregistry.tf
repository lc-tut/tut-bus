# Artifact Registry Repository
resource "google_artifact_registry_repository" "main" {
  location      = var.region
  repository_id = "tut-bus"
  description   = "TUT Bus Docker images"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"

    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [
    google_project_service.artifactregistry
  ]
}
