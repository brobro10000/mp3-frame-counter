# Purpose: keep the access root portable without accepting credentials or arbitrary authority.
# Supply project_id through private operator inputs; optional location/repository overrides remain bounded.
# Validation rejects malformed values, including explicit null instead of silently replacing it with a default.
variable "project_id" {
  description = "Existing dedicated application project ID, verified against the separate cost bootstrap."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "project_id must be a lowercase 6-30 character Google project identifier."
  }
}

variable "region" {
  description = "Regional location for the three state buckets and Docker repository."
  type        = string
  default     = "us-central1"

  validation {
    condition     = can(regex("^[a-z]+(-[a-z]+)+[0-9]+$", var.region))
    error_message = "region must be a lowercase regional identifier, such as us-central1, not a zone."
  }
}

variable "registry_id" {
  description = "Dedicated Docker repository identifier; no registry URL or image reference is accepted."
  type        = string
  default     = "mp3-images"

  validation {
    condition     = can(regex("^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$", var.registry_id))
    error_message = "registry_id must contain 1-63 lowercase letters, digits or hyphens, starting with a letter."
  }
}
