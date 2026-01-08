#!/bin/bash

# Post-deployment build script
# This script runs after the Docker container is built and before the application starts

echo "Running post-deployment setup..."

# Wait for database to be ready
echo "Waiting for database..."
timeout=60
counter=0
while ! npx prisma db push --accept-data-loss > /dev/null 2>&1; do
  if [ $counter -gt $timeout ]; then
    echo "Database connection timeout"
    exit 1
  fi
  counter=$((counter + 1))
  echo "Waiting for database... ($counter/$timeout)"
  sleep 1
done

echo "Database is ready"

# Run database migrations
echo "Running database migrations..."
if npx prisma migrate deploy; then
  echo "Migrations completed successfully"
else
  echo "Migration failed, but continuing..."
fi

# Generate Prisma client (in case it's needed)
echo "Generating Prisma client..."
npx prisma generate

echo "Post-deployment setup completed"