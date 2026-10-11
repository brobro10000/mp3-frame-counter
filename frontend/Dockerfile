# Build independently from the repository root: docker build --platform linux/amd64 -f frontend/Dockerfile -t mp3-frontend .
# React, TypeScript and Vite are build tools only; the final image serves their local static output with NGINX.
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY frontend ./frontend
RUN --network=none npm run build:frontend

# The pinned unprivileged NGINX base supplies the shell and standard tools; no runtime package install is needed.
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:15c994d10d6d78658721c3bcafff14cb281fba2a4bdf9d5ba92c416a472516e3

COPY --from=build --chown=101:101 /build/frontend/dist/ /usr/share/nginx/html/
COPY --chown=101:101 frontend/nginx.conf.template /etc/nginx/mp3.conf.template
COPY --chown=101:101 --chmod=0555 frontend/entrypoint.sh /usr/local/bin/mp3-frontend

USER 101:101
ENV PORT=8080 API_UPSTREAM=api:3000
EXPOSE 8080
STOPSIGNAL SIGQUIT
ENTRYPOINT ["/usr/local/bin/mp3-frontend"]
