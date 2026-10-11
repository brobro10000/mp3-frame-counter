# Purpose: bootstrap one dedicated billed project, API access and a gross-cost alerts-only budget.
# Apply creates external resources and local private state. It creates no application or public endpoints.
resource "google_project" "application" {
  project_id      = var.project_id
  name            = var.project_name
  billing_account = var.billing_account_id
  deletion_policy = "PREVENT"

  labels = {
    application = "mp3-frame-counter"
    managed_by  = "terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Service Usage must be available before enabling dependent APIs. Bootstrap identity must already
# have permission to use the Service Usage API; do not work around a failure with global config edits.
resource "google_project_service" "service_usage" {
  project                    = google_project.application.project_id
  service                    = "serviceusage.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
  deletion_policy            = "PREVENT"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_service" "bootstrap" {
  for_each = toset([
    "billingbudgets.googleapis.com",
    "cloudbilling.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "run.googleapis.com",
  ])

  project                    = google_project.application.project_id
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
  deletion_policy            = "PREVENT"

  depends_on = [google_project_service.service_usage]

  lifecycle {
    prevent_destroy = true
  }
}

# This alerts-only budget includes all project services. The separate REST-managed Cloud Run cap
# must also be verified before any billable application resources or deployment are introduced.
resource "google_billing_budget" "application_total" {
  provider        = google.budget
  billing_account = var.billing_account_id
  display_name    = "mp3-application-monthly-100-alert"
  deletion_policy = "PREVENT"

  # The API omits its default ownership scope on readback; unspecified has the same meaning as ALL_USERS.
  # Leave it unset so provider 8.6.0 does not propose a perpetual no-op ownership update after refresh.

  budget_filter {
    projects               = ["projects/${google_project.application.number}"]
    calendar_period        = "MONTH"
    credit_types_treatment = "EXCLUDE_ALL_CREDITS"
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "100"
      nanos         = 0
    }
  }

  dynamic "threshold_rules" {
    for_each = [0.5, 0.75, 0.9, 1.0]
    content {
      threshold_percent = threshold_rules.value
      spend_basis       = "CURRENT_SPEND"
    }
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "FORECASTED_SPEND"
  }

  # Omit all_updates_rule: provider 8.6.0 requires a Pub/Sub topic or monitoring channel in that block.
  # Default billing IAM email recipients remain active; project-recipient delivery belongs to the Run cap.

  depends_on = [google_project_service.bootstrap]

  lifecycle {
    prevent_destroy = true
  }
}

# Keep the dedicated project's Editor role empty before trusting protected remote state. This binding
# preserves unrelated roles and detects later drift; it does not continuously enforce IAM or restore grants on removal.
resource "google_project_iam_binding" "no_project_editors" {
  project = google_project.application.project_id
  role    = "roles/editor"
  members = []

  depends_on = [google_project_service.bootstrap["cloudresourcemanager.googleapis.com"]]

  lifecycle {
    prevent_destroy = true
  }
}
