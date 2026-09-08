#!/usr/bin/env bash

set -u

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
runner="$repo_root/.gitnexus/run.cjs"
runtime_dir="$repo_root/.gitnexus"
log_file="$runtime_dir/refresh.log"

if [[ ! -f "$runner" ]]; then
	printf '%s\n' 'GitNexus refresh skipped: run `npx gitnexus analyze` once to bootstrap the local runner.'
	exit 0
fi

if [[ "${1:-}" == "--background" ]]; then
	reason="${2:-git hook}"
	nohup "$0" "$reason" >>"$log_file" 2>&1 </dev/null &
	exit 0
fi

reason="${1:-manual refresh}"
lock_file="$runtime_dir/refresh.lock"

exec 9>"$lock_file"
if ! flock -n 9; then
	printf '[%s] GitNexus refresh already running; skipped %s.\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$reason"
	exit 0
fi

printf '[%s] Refreshing GitNexus index after %s.\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$reason"
if (cd "$repo_root" && node "$runner" analyze --index-only); then
	printf '[%s] GitNexus index refresh completed.\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
else
	status=$?
	printf '[%s] GitNexus index refresh failed with status %s.\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$status"
	exit "$status"
fi
