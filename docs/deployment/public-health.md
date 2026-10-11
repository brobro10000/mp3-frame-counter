# Public and container health routes

The NGINX frontend serves `GET /health` with HTTP 200, JSON Content-Type and exactly `{"status":"ok"}`. Other methods,
including HEAD, receive HTTP 405 with `Allow: GET`; HEAD has no response body. This check runs inside the frontend and
does not contact the API or establish API readiness, release identity or acceptance.

Use `/health` through the configured hosted HTTPS origin or local frontend ingress. Cloud Run reserves some URL paths
ending in `z` and recommends avoiding that suffix; a request rejected by its ingress never reaches NGINX. See
[Google's reserved URL paths](https://docs.cloud.google.com/run/docs/known-issues#reserved-url-paths).

Each container retains its existing local `GET /healthz` route, including its startup probe. The frontend's local
`/healthz` still returns the same service-local response; the API's `/healthz` remains separate. No API route or OpenAPI
change accompanies the public alias.

Follow the independent [hosted-health-v1 contract](../testing/contracts/hosted-health-v1.md),
[bounded V1 delivery](v1-delivery.md) and [release runbook](runbook.md). Hosted acceptance must use the
launcher-approved canonical provider origin and its actual `/health` response. A local pass or provider-reserved
`/healthz` failure does not satisfy that gate; this documentation records the route contract, not a deployed or verified
hosted outcome.
