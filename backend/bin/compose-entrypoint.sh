#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for MySQL at ${DB_HOST:-db}..."
until mysqladmin ping -h"${DB_HOST:-db}" -u"${DB_USERNAME:-app}" -p"${DB_PASSWORD:-secret}" --silent; do
  sleep 1
done
echo "MySQL is up."

bundle exec rails db:prepare || true
exec bundle exec rails s -p 3000 -b 0.0.0.0
