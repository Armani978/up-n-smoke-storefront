#!/bin/sh
set -eu

# Keep custom module tables in sync before Medusa begins accepting traffic.
# Medusa 2.16 can leave its migration event loop open after the SQL commits, so
# the run is bounded. A bounded run is only safe to continue from when the
# migration actually reported completion: treating every timeout as success once
# started the API against a schema that had never been created.
MIGRATION_TIMEOUT="${MEDUSA_MIGRATION_TIMEOUT:-600}"
migration_log="$(mktemp)"
migration_status=0

# --concurrency 1 is required, not a tuning knob. Medusa takes a per-module
# advisory-lock transaction from a connection pool it hardcodes to max: 1, so
# the default concurrency makes every module race for that single connection
# and fail with "Timeout acquiring a connection. The pool is probably full."
timeout --kill-after=10s "${MIGRATION_TIMEOUT}s" npx medusa db:migrate --concurrency 1 2>&1 | tee "$migration_log" || migration_status=$?

if [ "$migration_status" -ne 0 ] && [ "$migration_status" -ne 124 ]; then
  echo "Database migration failed with status $migration_status." >&2
  exit "$migration_status"
fi

if [ "$migration_status" -eq 124 ]; then
  if grep -qiE "migrations completed|no migrations were|already up to date" "$migration_log"; then
    echo "Database migration committed but did not exit; continuing startup." >&2
  else
    echo "Database migration timed out after ${MIGRATION_TIMEOUT}s without committing. Refusing to start." >&2
    exit 1
  fi
fi

rm -f "$migration_log"

exec npm run start
