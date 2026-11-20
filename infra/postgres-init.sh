#!/bin/sh
# Runs once, on the first start of an empty Postgres volume.
set -e
psql -v ON_ERROR_STOP=1 -U postgres \
  -v owner_password="$OWNER_DB_PASSWORD" -v app_password="$APP_DB_PASSWORD" -f /db-init.sql
