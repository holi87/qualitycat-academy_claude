#!/bin/sh
set -e

echo "Running database migrations..."
prisma migrate deploy

if [ "$RUN_SEED" = "1" ]; then
  echo "Seeding database..."
  node dist/prisma/seed.js
fi

echo "Starting server..."
exec node dist/src/server.js
