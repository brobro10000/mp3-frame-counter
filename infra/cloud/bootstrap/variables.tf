# Purpose: require operator-selected identities without embedding private account details.
# Provide these through a private tfvars file; never place authentication material in inputs.
variable "project_id" {
  description = "New dedicated Google Cloud project ID; do not select an unrelated existing project."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "project_id must be a valid 6-30 character Google Cloud project ID."
  }
}

variable "project_name" {
  description = "Display name of the dedicated application project."
  type        = string

  validation {
    condition     = length(var.project_name) >= 4 && length(var.project_name) <= 30
    error_message = "project_name must contain 4-30 characters."
  }
}

variable "billing_account_id" {
  description = "Owner-approved active USD billing account; account identifier is private deployment metadata."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}$", var.billing_account_id))
    error_message = "billing_account_id must use the Google billing account identifier format."
  }
}

variable "billing_currency_confirmed_usd" {
  description = "Operator confirms the selected billing account's actual currency is USD before planning."
  type        = bool

  validation {
    condition     = var.billing_currency_confirmed_usd
    error_message = "Verify the billing account uses USD before applying the fixed-dollar controls."
  }
}
