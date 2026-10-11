# Purpose: pin the access-only Terraform contract; authentication is supplied externally.
# Inputs are the explicit dedicated project/region and private backend configuration supplied at init.
# Migrate the existing private state only after the operations bucket exists and passes readback.
# No bucket, prefix or credential value belongs in tracked source; CI disables backend initialization.
# Initialization installs only the pinned provider. Version or permission failures must stop operations.
terraform {
  backend "gcs" {}

  required_version = "= 1.13.3"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "8.6.0"
    }
  }
}

provider "google" {
  project               = var.project_id
  billing_project       = var.project_id
  region                = var.region
  user_project_override = true
}
