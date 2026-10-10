# Purpose: pin the reviewed Terraform/provider contract for this cost-only bootstrap.
# Authentication is supplied externally; no token, key or credential variable belongs in state.
terraform {
  required_version = "= 1.13.3"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "8.6.0"
    }
  }
}

# Project creation cannot charge API quota to a project that does not exist yet.
provider "google" {
  user_project_override = false
}

# Budget calls use the new project only after its Budget API has been enabled.
provider "google" {
  alias                 = "budget"
  project               = var.project_id
  billing_project       = var.project_id
  user_project_override = true
}
