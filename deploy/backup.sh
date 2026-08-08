#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/upnsmoke/app"
ENV_FILE="/opt/upnsmoke/.env"
BACKUP_DIR="/opt/upnsmoke/backups"
COMPOSE_FILE="$APP_DIR/docker-compose.production.yml"

install -d -m 700 "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$BACKUP_DIR/upnsmoke-${timestamp}.dump"

docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$backup_file"

test -s "$backup_file"
chmod 600 "$backup_file"

# Keep two weeks of daily backups on this server.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'upnsmoke-*.dump' -mtime +14 -delete

