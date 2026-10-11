# Purpose: prepare protected state storage, a Docker registry and narrowly scoped federated delivery identities.
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

  # Omit the optional false-valued block: provider/API absence represents mutable tags without recurring drift.
  vulnerability_scanning_config {
    enablement_config = "DISABLED"
  }

  depends_on = [google_project_service.required["artifactregistry.googleapis.com"]]

  lifecycle {
    prevent_destroy = true
  }
}

# Identities have no keys. Only the two explicitly bound delivery accounts accept federation below.
# Runtime accounts receive no application API roles.
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

# GitHub's fixed issuer can enter this dedicated pool only through the exact protected-main push workflow below.
# Numeric repository and owner inputs bind identity independently of repository-name reuse.
resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "mp3-github"
  display_name              = "MP3 GitHub delivery"
  disabled                  = false

  depends_on = [google_project_service.required["iam.googleapis.com"]]

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "Protected main push"
  disabled                           = false

  attribute_mapping = {
    "google.subject"          = "assertion.sub"
    "attribute.repository_id" = "assertion.repository_id"
  }
  attribute_condition = "assertion.repository_id == '${var.github_repository_id}' && assertion.repository_owner_id == '${var.github_owner_id}' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == '${var.github_repository}/.github/workflows/ci.yml@refs/heads/main' && assertion.event_name == 'push'"

  # Omit custom audiences: only the standard provider-resource audience is accepted.
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Federation never reaches production accounts or the probe directly. Stage mints only its existing probe ID token.
resource "google_service_account_iam_member" "github_federated" {
  for_each = toset(["mp3-registry-writer", "mp3-stage-deployer"])

  service_account_id = google_service_account.identity[each.value].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository_id/${var.github_repository_id}"

  depends_on = [google_iam_workload_identity_pool_provider.github]

  lifecycle {
    prevent_destroy = true
  }
}

# Project budget reads, quota usage and operation polling cannot alter cost controls or production services.
# Known operations anywhere in this project are readable; this is not per-service or per-budget isolation.
resource "google_project_iam_custom_role" "stage_cost_read" {
  project     = var.project_id
  role_id     = "mp3StageCostRead"
  title       = "MP3 stage cost readiness"
  description = "Read dedicated project budgets and Cloud Run operations; use quota for bounded stage delivery."
  stage       = "GA"
  permissions = [
    "resourcemanager.projects.get",
    "billing.resourcebudgets.read",
    "serviceusage.services.use",
    "run.operations.get",
  ]

  depends_on = [google_project_service.required["iam.googleapis.com"]]

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_iam_member" "stage_cost_reader" {
  project = var.project_id
  role    = google_project_iam_custom_role.stage_cost_read.name
  member  = google_service_account.identity["mp3-stage-deployer"].member

  lifecycle {
    prevent_destroy = true
  }
}
