#!/bin/sh
# Start unprivileged NGINX with a configuration rendered into ephemeral /tmp.
# Usage: container entrypoint; PORT defaults to 8080 and API_UPSTREAM to local api:3000. Managed environments must
# explicitly supply their private API host:port. Reads /etc/resolv.conf; needs writable /tmp and the bundled template.
# Validates substitution values, writes /tmp/nginx.conf, checks it, then replaces this process with foreground NGINX.
# Invalid ports/upstreams/DNS, unwritable paths or invalid NGINX configuration exit nonzero without starting a server.
# Never installs packages, changes privileges, logs environment values or writes to the read-only image filesystem.
set -eu

fail() {
    printf '%s\n' "$1" >&2
    exit 1
}

PORT=${PORT:-8080}
API_UPSTREAM=${API_UPSTREAM:-api:3000}
case "$PORT" in
    ''|*[!0-9]*) fail 'PORT must be an integer from 1024 to 65535.' ;;
esac
[ "${#PORT}" -le 5 ] && [ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] ||
    fail 'PORT must be an integer from 1024 to 65535.'

# Whitelist a hostname/IPv4 or bracketed IPv6 address with an explicit port; reject schemes, paths and directives.
case "$API_UPSTREAM" in
    *'
'*) fail 'API_UPSTREAM must be a single host:port value.' ;;
esac
printf '%s\n' "$API_UPSTREAM" | LC_ALL=C grep -Eq '^([A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?|\[[0-9A-Fa-f:]+\]):[0-9]+$' ||
    fail 'API_UPSTREAM must be a hostname:port or [IPv6]:port without a scheme or path.'
upstream_port=${API_UPSTREAM##*:}
[ "${#upstream_port}" -le 5 ] && [ "$upstream_port" -ge 1 ] && [ "$upstream_port" -le 65535 ] ||
    fail 'API_UPSTREAM port must be from 1 to 65535.'

# NGINX expects IPv6 resolver literals in brackets. Never interpolate comments or unvalidated resolver tokens.
resolvers=$(awk '
    $1 == "nameserver" {
        if ($2 !~ /^[0-9A-Fa-f:.]+$/) exit 1;
        if (index($2, ":")) printf "[%s] ", $2;
        else printf "%s ", $2;
        count++;
    }
    END { if (!count) exit 1; }
' /etc/resolv.conf) || fail 'Runtime DNS must provide at least one valid IP nameserver.'

umask 077
sed -e "s|@@PORT@@|$PORT|g" \
    -e "s|@@API_UPSTREAM@@|$API_UPSTREAM|g" \
    -e "s|@@RESOLVERS@@|$resolvers|g" \
    /etc/nginx/mp3.conf.template > /tmp/nginx.conf
nginx -t -c /tmp/nginx.conf
exec nginx -c /tmp/nginx.conf -g 'daemon off;'
