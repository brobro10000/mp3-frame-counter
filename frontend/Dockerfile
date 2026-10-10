# Build independently with: docker build --platform linux/amd64 -t mp3-frontend frontend
# The pinned unprivileged NGINX base supplies the shell and standard tools; no runtime package install is needed.
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:15c994d10d6d78658721c3bcafff14cb281fba2a4bdf9d5ba92c416a472516e3

COPY --chown=101:101 index.html styles.css app.js /usr/share/nginx/html/
COPY --chown=101:101 nginx.conf.template /etc/nginx/mp3.conf.template
COPY --chown=101:101 --chmod=0555 entrypoint.sh /usr/local/bin/mp3-frontend

USER 101:101
ENV PORT=8080 API_UPSTREAM=api:3000
EXPOSE 8080
STOPSIGNAL SIGQUIT
ENTRYPOINT ["/usr/local/bin/mp3-frontend"]
