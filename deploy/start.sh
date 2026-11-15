#!/usr/bin/env bash
set -Eeuo pipefail

java -jar /app/socia.jar &
java_pid=$!

nginx -c /app/nginx.conf -g 'daemon off;' &
nginx_pid=$!

cleanup() {
    trap - EXIT TERM INT
    kill -TERM "$java_pid" "$nginx_pid" 2>/dev/null || true
    wait "$java_pid" "$nginx_pid" 2>/dev/null || true
}

trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

set +e
wait -n "$java_pid" "$nginx_pid"
status=$?
set -e

exit "$status"