# Purpose: accept only the fixed environment, exact source and digest-bound pair in the dedicated Docker registry.
# Operators supply reviewed values; no target URL, account override, role, credential or arbitrary image is accepted.
# Invalid or null inputs fail validation before a usable runtime plan can be produced.
variable "project_id" {
  description = "Existing dedicated project whose cost controls and access foundation are verified."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "project_id must be a lowercase 6-30 character Google project identifier."
  }
}

variable "region" {
  description = "Verified runtime and registry region."
  type        = string
  default     = "us-central1"

  validation {
    condition     = can(regex("^[a-z]+(-[a-z]+)+[0-9]+$", var.region))
    error_message = "region must be a lowercase regional identifier, such as us-central1, not a zone."
  }
}

variable "registry_id" {
  description = "Existing dedicated Docker repository identifier."
  type        = string
  default     = "mp3-images"

  validation {
    condition     = can(regex("^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$", var.registry_id))
    error_message = "registry_id must contain 1-63 lowercase letters, digits or hyphens, starting with a letter."
  }
}

variable "environment" {
  description = "Fixed stage or production environment; production always requires exact human authorization."
  type        = string

  validation {
    condition     = can(regex("^(stage|production)$", var.environment))
    error_message = "environment must be stage or production."
  }
}

variable "api_image" {
  description = "Verified API image digest in this project's regional Docker repository, transferred without rebuilding."
  type        = string

  validation {
    condition     = can(regex("^${var.region}-docker[.]pkg[.]dev/${var.project_id}/${var.registry_id}/api@sha256:[a-f0-9]{64}$", var.api_image))
    error_message = "api_image must identify the dedicated api image by lowercase SHA-256 digest."
  }
}

variable "frontend_image" {
  description = "Verified frontend digest paired with api_image in the same tested release."
  type        = string

  validation {
    condition     = can(regex("^${var.region}-docker[.]pkg[.]dev/${var.project_id}/${var.registry_id}/frontend@sha256:[a-f0-9]{64}$", var.frontend_image))
    error_message = "frontend_image must identify the dedicated frontend image by lowercase SHA-256 digest."
  }
}

variable "source_revision" {
  description = "Exact protected-main source commit bound to the tested image pair."
  type        = string

  validation {
    condition     = can(regex("^[a-f0-9]{40}$", var.source_revision))
    error_message = "source_revision must be a lowercase 40-character Git commit SHA."
  }
}
