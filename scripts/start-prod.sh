#!/bin/sh

# Exit on error
set -e

echo "Starting production environment..."

# Run database migrations/synchronization
if [ -n "$DATABASE_URL" ]; then
  echo "Synchronizing database schema..."
  prisma db push --accept-data-loss --url "$DATABASE_URL"
else
  echo "Warning: DATABASE_URL not set, skipping database sync."
fi

# Start the application
echo "Starting Next.js application..."
exec node server.js
