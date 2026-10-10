# Purpose: prepare protected state storage, a Docker registry and narrowly scoped delivery identities.
# A reviewed apply creates exactly these access resources and writes private state; it creates no application service.
# Use only after current cost-control readback. Unexpected resources, permission failures or replacement plans block use.
# Teardown requires a separate protection/retention amendment; never remove safeguards to force an ordinary destroy.
locals {
  environments = {
    stage      = "stage"
    production = "prod"
  }
}

# Bootstrap already owns Service Usage, Budget, Billing, Resource Manager and Run APIs.
resource "google_project_service" "required" {
  for_each = toset([
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "artifactregistry.googleapis.com",
    "storage.googleapis.com",
  ])

  project                    = var.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
  deletion_policy            = "PREVENT"

  lifecycle {
    prevent_destroy = true
  }
}

# Separate buckets prevent stage state access from granting operations or production state access.
# Soft delete and versioning support recovery without locking the backend's state or lock objects.
resource "google_storage_bucket" "state" {
  for_each = toset(["operations", "stage", "production"])

  project                     = var.project_id
  name                        = "${var.project_id}-tf-${each.value}"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  deletion_policy             = "PREVENT"

  versioning {
    enabled = true
  }

  soft_delete_policy {
    retention_duration_seconds = 604800
  }

  depends_on = [google_project_service.required["storage.googleapis.com"]]

  lifecycle {
    prevent_destroy = true
  }
}

# Digest-bound deployment and protected image transfer remain separate work; this is storage only.
# No cleanup policy can delete versions, and scanning is explicitly disabled rather than inherited.
resource "google_artifact_registry_repository" "images" {
  project                = var.project_id
  location               = var.region
  repository_id          = var.registry_id
  format                 = "DOCKER"
  mode                   = "STANDARD_REPOSITORY"
  deletion_policy        = "PREVENT"
  cleanup_policy_dry_run = true

  docker_config {
    immutable_tags = false
  }

  vulnerability_scanning_config {
    enablement_config = "DISABLED"
  }

  depends_on = [google_project_service.required["artifactregistry.googleapis.com"]]

  lifecycle {
    prevent_destroy = true
  }
}

# Identities have no keys or external impersonation bindings. Runtime accounts receive no application API roles.
resource "google_service_account" "identity" {
  for_each = toset([
    "mp3-registry-writer",
    "mp3-stage-deployer",
    "mp3-stage-probe",
    "mp3-stage-runtime",
    "mp3-prod-deployer",
    "mp3-prod-probe",
    "mp3-prod-runtime",
  ])

  project                      = var.project_id
  account_id                   = each.value
  display_name                 = each.value
  description                  = "Dedicated MP3 access identity; permissions are separately scoped to exact resources."
  disabled                     = false
  create_ignore_already_exists = false
  deletion_policy              = "PREVENT"

  depends_on = [google_project_service.required["iam.googleapis.com"]]

  lifecycle {
    prevent_destroy = true
  }
}

# Individual member grants preserve other independently owned IAM entries.
resource "google_artifact_registry_repository_iam_member" "writer" {
  project    = var.project_id
  location   = google_artifact_registry_repository.images.location
  repository = google_artifact_registry_repository.images.repository_id
  role       = "roles/artifactregistry.writer"
  member     = google_service_account.identity["mp3-registry-writer"].member
}

resource "google_artifact_registry_repository_iam_member" "deployer_readers" {
  for_each = local.environments

  project    = var.project_id
  location   = google_artifact_registry_repository.images.location
  repository = google_artifact_registry_repository.images.repository_id
  role       = "roles/artifactregistry.reader"
  member     = google_service_account.identity["mp3-${each.value}-deployer"].member
}

# Operations and production state have no automated principal in this initial foundation.
resource "google_storage_bucket_iam_member" "stage_state" {
  bucket = google_storage_bucket.state["stage"].name
  role   = "roles/storage.objectAdmin"
  member = google_service_account.identity["mp3-stage-deployer"].member
}

resource "google_service_account_iam_member" "runtime_user" {
  for_each = local.environments

  service_account_id = google_service_account.identity["mp3-${each.value}-runtime"].name
  role               = "roles/iam.serviceAccountUser"
  member             = google_service_account.identity["mp3-${each.value}-deployer"].member
}

# This permits only stage-probe ID tokens; it grants neither Run invocation nor general access-token creation.
resource "google_service_account_iam_member" "stage_probe_minter" {
  service_account_id = google_service_account.identity["mp3-stage-probe"].name
  role               = "roles/iam.serviceAccountOpenIdTokenCreator"
  member             = google_service_account.identity["mp3-stage-deployer"].member

  depends_on = [google_project_service.required["iamcredentials.googleapis.com"]]
}
