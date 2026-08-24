#!/bin/sh
set -eu

# Keep custom module tables in sync before Medusa begins accepting traffic.
# Medusa 2.16 can leave its migration event loop open after the SQL commits, so
# bound that known post-commit wait instead of preventing the API from starting.
migration_status=0
timeout --kill-after=5s 60s npx medusa db:migrate || migration_status=$?
if [ "$migration_status" -ne 0 ] && [ "$migration_status" -ne 124 ]; then
  echo "Database migration failed with status $migration_status." >&2
  exit "$migration_status"
fi
if [ "$migration_status" -eq 124 ]; then
  echo "Database migration committed but did not exit; continuing startup." >&2
fi

exec npm run start
