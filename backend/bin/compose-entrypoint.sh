#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_USERNAME="${DB_USERNAME:-app}"
DB_PASSWORD="${DB_PASSWORD:-secret}"

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."

if command -v mysqladmin >/dev/null 2>&1; then
  # mysqladmin が入っている場合は正攻法
  until mysqladmin ping -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USERNAME}" -p"${DB_PASSWORD}" --silent; do
    sleep 1
  done
else
  # ない場合はTCPレベルで待機
  until (echo > /dev/tcp/"${DB_HOST}"/"${DB_PORT}") >/dev/null 2>&1; do
    sleep 1
  done
fi

echo "✅ MySQL is up."

# 初回でも毎回でも安全に
echo "Running db:prepare..."
bundle exec rails db:prepare || true

echo "🚀 Starting Rails server on 0.0.0.0:3000..."
exec bundle exec rails s -p 3000 -b 0.0.0.0
