# Purpose: hand trusted Terraform identities to the separately owned cap reconciler.
# Sensitive marks redact ordinary CLI output, but state and explicit JSON output still contain IDs.
output "cap_config" {
  description = "Private reconciler input. Store as cap-config.private.json with restrictive permissions."
  sensitive   = true
  value = {
    schemaVersion    = 1
    billingAccountId = var.billing_account_id
    projectNumber    = tostring(google_project.application.number)
    quotaProjectId   = google_project.application.project_id
    currencyCode     = "USD"
  }
  depends_on = [google_billing_budget.application_total]
}

output "alerts_budget_resource_name" {
  description = "Exact alerts-only budget identity; this does not establish spend-cap readiness."
  sensitive   = true
  value       = google_billing_budget.application_total.id
}
