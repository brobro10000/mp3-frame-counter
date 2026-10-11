# Purpose: deploy one authenticated service revision containing the exact tested NGINX/API image pair.
# Apply affects only this environment's service and its two bounded IAM memberships (one membership in production).
# Owner credentials create the initial service. Automation can update only existing stage; production is human-gated.
# Failed readiness, identity or acceptance blocks promotion. Limits reduce exposure but are not a hard spending cap.
locals {
  account_environment = var.environment == "stage" ? "stage" : "prod"
  runtime_account     = "mp3-${local.account_environment}-runtime@${var.project_id}.iam.gserviceaccount.com"
  probe_account       = "mp3-${local.account_environment}-probe@${var.project_id}.iam.gserviceaccount.com"
  deployer_account    = "mp3-${local.account_environment}-deployer@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_cloud_run_v2_service" "application" {
  project              = var.project_id
  location             = var.region
  name                 = "mp3-${var.environment}"
  deletion_protection  = true
  ingress              = "INGRESS_TRAFFIC_ALL"
  invoker_iam_disabled = false
  default_uri_disabled = false

  labels = {
    application     = "mp3-frame-counter"
    environment     = var.environment
    source_revision = var.source_revision
  }

  scaling {
    min_instance_count = 0
    max_instance_count = 1
  }

  template {
    service_account                  = local.runtime_account
    execution_environment            = "EXECUTION_ENVIRONMENT_GEN2"
    timeout                          = "60s"
    max_instance_request_concurrency = 2

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }

    # The API sidecar has no ingress port; NGINX reaches it through the service's shared loopback network.
    containers {
      name  = "api"
      image = var.api_image

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = false
      }

      startup_probe {
        period_seconds    = 10
        timeout_seconds   = 2
        failure_threshold = 6
        http_get {
          path = "/healthz"
          port = 3000
        }
      }
    }

    # Only the frontend accepts ingress. Its startup waits for API health before serving the shared browser origin.
    containers {
      name       = "frontend"
      image      = var.frontend_image
      depends_on = ["api"]

      ports {
        name           = "http1"
        container_port = 8080
      }

      env {
        name  = "API_UPSTREAM"
        value = "127.0.0.1:3000"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = false
      }

      startup_probe {
        period_seconds    = 10
        timeout_seconds   = 2
        failure_threshold = 6
        http_get {
          path = "/healthz"
          port = 8080
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Only the corresponding probe can invoke this service; no public principal is introduced.
resource "google_cloud_run_v2_service_iam_member" "probe_invoker" {
  project  = google_cloud_run_v2_service.application.project
  location = google_cloud_run_v2_service.application.location
  name     = google_cloud_run_v2_service.application.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${local.probe_account}"
}

# Initial owner creation establishes this grant; it never gives stage credentials production or project-wide access.
resource "google_cloud_run_v2_service_iam_member" "stage_admin" {
  count = var.environment == "stage" ? 1 : 0

  project  = google_cloud_run_v2_service.application.project
  location = google_cloud_run_v2_service.application.location
  name     = google_cloud_run_v2_service.application.name
  role     = "roles/run.admin"
  member   = "serviceAccount:${local.deployer_account}"
}
