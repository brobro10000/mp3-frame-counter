# Purpose: pin the access-only Terraform contract; authentication is supplied externally.
# Inputs are the explicit dedicated project/region. Initial applies keep private local state.
# A reviewed later amendment selects GCS after its bucket exists; no backend override belongs here.
# Initialization installs only the pinned provider. Version or permission failures must stop operations.
terraform {
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
