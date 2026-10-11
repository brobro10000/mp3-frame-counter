# Purpose: keep the access root portable without accepting credentials or arbitrary authority.
# Supply project and observed GitHub identities through private operator inputs; location/repository remain bounded.
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

# Names select the exact workflow claim; numeric identities separately resist renamed or reused repository names.
variable "github_repository" {
  description = "Observed owner/repository name of the protected-main GitHub CI workflow."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$", var.github_repository))
    error_message = "github_repository must be a bounded owner/repository name without URLs, whitespace or quotes."
  }
}

variable "github_repository_id" {
  description = "Observed positive numeric GitHub repository ID, supplied as a string."
  type        = string

  validation {
    condition     = can(regex("^[1-9][0-9]{0,19}$", var.github_repository_id))
    error_message = "github_repository_id must be a positive decimal ID of at most 20 digits."
  }
}

variable "github_owner_id" {
  description = "Observed positive numeric GitHub repository-owner ID, supplied as a string."
  type        = string

  validation {
    condition     = can(regex("^[1-9][0-9]{0,19}$", var.github_owner_id))
    error_message = "github_owner_id must be a positive decimal ID of at most 20 digits."
  }
}
