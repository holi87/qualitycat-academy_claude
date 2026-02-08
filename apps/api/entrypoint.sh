#!/bin/sh
set -e

echo "Applying database schema..."
if [ -d "./prisma/migrations" ] && [ "$(find ./prisma/migrations -mindepth 1 -maxdepth 1 -type d | wc -l)" -gt 0 ]; then
  echo "Running Prisma migrations..."
  prisma migrate deploy
else
  echo "No migration files found. Running prisma db push..."
  prisma db push
fi

if [ "$RUN_SEED" = "1" ]; then
  echo "Seeding database..."
  node dist/prisma/seed.js
fi

echo "Starting server..."
exec node dist/src/server.js
