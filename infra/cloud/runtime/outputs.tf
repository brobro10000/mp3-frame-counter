# Purpose: expose nonsecret service and image identities for independent provider readback and hosted acceptance.
# These configured values do not replace observed readiness, revision/digest verification or production authorization.
output "service_name" {
  description = "Fixed environment service name."
  value       = google_cloud_run_v2_service.application.name
}

output "service_resource_id" {
  description = "Fully qualified service identity that must match trusted provider observations."
  value       = google_cloud_run_v2_service.application.id
}

output "service_uri" {
  description = "Provider-returned authenticated service origin; the launcher must validate it before credentials."
  value       = google_cloud_run_v2_service.application.uri
}

output "runtime_service_account" {
  description = "Dedicated environment runtime identity with no application API roles."
  value       = local.runtime_account
}

output "configured_images" {
  description = "Digest-bound API/frontend pair; provider revision readback must independently match both values."
  value = {
    api      = var.api_image
    frontend = var.frontend_image
  }
}
