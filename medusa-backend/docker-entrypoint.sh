#!/bin/sh
set -eu

# Keep custom module tables in sync before Medusa begins accepting traffic.
# Never time this out and continue: a stalled or failed migration means the
# schema is not proven ready, so the container must remain unhealthy and let
# the deployment health gate roll back.
npx medusa db:migrate --skip-scripts --execute-safe-links --all-or-nothing

exec npm run start
