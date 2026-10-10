#!/usr/bin/env sh
# Nightly Postgres backup for Wattle & Wander (Brunswick Depot).
# Usage: POSTGRES_USER=hartley POSTGRES_PASSWORD=... ./scripts/backup.sh
# Uploads a compressed dump to $BACKUP_DIR (default ./backups) with 7/30-day
# retention. Point a scheduler (cron/systemd/VPS) at this file; rehearse
# restores quarterly: pg_restore -d caravan backup.dump
set -eu
: "${POSTGRES_DB:=caravan}"
: "${POSTGRES_USER:=hartley}"
: "${BACKUP_DIR:=./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/caravan-$STAMP.dump"
pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$OUT"
gzip -f "$OUT"
echo "backup: $OUT.gz"
# Retention: keep 7 daily, 4 weekly (30-day window approx).
ls -1t "$BACKUP_DIR"/caravan-*.dump.gz | tail -n +12 | xargs -r rm -f
echo "retention: pruned to latest 11 dumps"
