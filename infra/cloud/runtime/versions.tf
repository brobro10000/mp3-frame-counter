# Purpose: pin the runtime Terraform toolchain; authentication and private backend settings come from the operator.
# Initialize each environment against its separate reviewed bucket/prefix. Never place credentials in tracked source.
# CI uses backend-disabled, credential-free mocks; a real plan/apply requires verified cost and candidate evidence.
# Initialization or permission failures stop delivery rather than selecting another backend or provider.
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
