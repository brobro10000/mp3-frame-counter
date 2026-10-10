# Purpose: expose only nonsecret resource identities for independently reviewed later configuration.
# These outputs are observations/configuration bindings, not proof of live IAM, image provenance or deployment authority.
# Operator values and state remain private; no token-producing data source or credential output is present.
output "state_bucket_names" {
  description = "Protected state bucket names, keyed by operations, stage and production."
  value       = { for environment, bucket in google_storage_bucket.state : environment => bucket.name }
}

output "registry_name" {
  description = "Fully qualified regional Docker repository resource name."
  value       = "projects/${var.project_id}/locations/${var.region}/repositories/${google_artifact_registry_repository.images.repository_id}"
}

output "registry_uri" {
  description = "Regional Docker registry URI; image references must later bind verified immutable digests."
  value       = google_artifact_registry_repository.images.registry_uri
}

output "service_account_emails" {
  description = "Dedicated service-account email identities, keyed by fixed account ID."
  value       = { for account_id, identity in google_service_account.identity : account_id => identity.email }
}

output "service_account_names" {
  description = "Fully qualified dedicated service-account names, keyed by fixed account ID."
  value       = { for account_id, identity in google_service_account.identity : account_id => identity.name }
}
