# Deployment preflight

Observed on 2026-10-09 before application implementation, under the owner's instruction to preload deployment access and
complete P1–P5. This is prerequisite evidence, not a deployed application or completed P5.

## Available local execution

Docker Desktop was installed but stopped. It was started successfully. Engine 29.7.2, Compose 5.4.0 and buildx are
available, including `linux/amd64` support. The host runtime test used `linux/arm64`; an amd64 application build remains
required before the proposed Render deployment.

The following public base-image indexes were fetched from Docker Hub and verified by the Docker client. Both declare
amd64 and arm64 support. Local pulls and network-disabled version checks passed:

| Image                                       | Immutable index digest                                                    | Observed runtime                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `node:24.20.0-alpine`                       | `sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf` | Node 24.20.0, npm 11.19.0; application image must select a non-root user |
| `nginxinc/nginx-unprivileged:stable-alpine` | `sha256:15c994d10d6d78658721c3bcafff14cb281fba2a4bdf9d5ba92c416a472516e3` | NGINX 1.30.5, UID 101                                                    |

The default Docker credential helper stalled on public-image metadata. An isolated anonymous Docker configuration
resolved public pulls without changing the user's global configuration or requesting private credentials. No TLS
verification was disabled. Temporary configuration and raw observations remain ignored.

## Provider access

Render GitHub sign-in required identity/email-read access only; no repository, organization or administrative access was
granted. It reached new-account registration. No Render account/workspace, payment method, region or service was
established. The account-creation action accepts Render's terms and requires action-time confirmation under the browser
automation policy. That confirmation and a deployment budget were requested; they remain external prerequisites.

1Password CLI 2.39.0 exists, but bounded session/account probes did not return. An unlocked desktop vault did not
establish unattended CLI access. No credential values or broad application-access permissions were exposed or changed.

No cloud resource, purchase, secret, deployment, production promotion or recovery operation occurred. Local phases can
proceed while provider prerequisites are unresolved. P5 cannot be reported complete from this preflight.

## Provider verification still required

The [proposed provider evaluation](../architecture/deployment.md) remains conditional. Render documents private services
and same-region networking, image-specific deploys, and paid-service SSH access. These do not prove the full 20 MiB
ingress behavior or the required controlled fault operations for this application. Establish actual supported candidate
diagnostics, isolation, timeout/recovery behavior, account permissions and costs before accepting the provider.

Primary references checked during preflight:

- [Private services](https://render.com/docs/private-services) and
  [private networking](https://render.com/docs/private-network).
- [SSH and shell access](https://render.com/docs/ssh).
- [Trigger an image deployment](https://api-docs.render.com/reference/create-deploy).
- [Service configuration updates](https://api-docs.render.com/reference/update-service).

Configuration changes require a separate deploy call. Exact image digests and the current service configuration must be
bound to release evidence; a deploy request or healthy service alone cannot establish successful application acceptance.
