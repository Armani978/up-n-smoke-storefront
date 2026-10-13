# Production operations

The production application runs from `/opt/upnsmoke/app` with Docker Compose.
Secrets are stored separately in `/opt/upnsmoke/.env` and must not be committed.

## Service status

```bash
cd /opt/upnsmoke/app
docker compose --env-file /opt/upnsmoke/.env -f docker-compose.production.yml ps
```

## Logs

```bash
cd /opt/upnsmoke/app
docker compose --env-file /opt/upnsmoke/.env -f docker-compose.production.yml logs --tail=200 backend storefront
```

## Database backups

The server runs `/opt/upnsmoke/backup.sh` every day at 03:00 UTC and retains 14 days of backups in `/opt/upnsmoke/backups`.

Run an additional backup before a deployment:

```bash
sudo /opt/upnsmoke/backup.sh
```

These backups are stored on the VPS. Copy them to separate storage for disaster recovery from a total VPS failure.

## Domain rollback

During the initial cutover, the quickest rollback is to restore the root-domain DNS A record to the previous server IP. DNS changes can take time to propagate.
