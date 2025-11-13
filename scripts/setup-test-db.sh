#!/bin/bash

# Setup Test Database for E2E Tests
# This script initializes the test database with the required schema

set -e

echo "🔧 Setting up test database..."

# Load test environment variables
export $(cat .env.test | grep -v '^#' | xargs)

# Check if test database container is running
if ! docker ps | grep -q plati_rb_ro_test_db; then
  echo "❌ Test database container is not running"
  echo "Starting test database..."
  docker compose up -d plati_rb_ro_test
  sleep 5
fi

# Check if database is ready
echo "⏳ Waiting for test database to be ready..."
until docker exec plati_rb_ro_test_db pg_isready -U plati_rb_ro_test_user -d plati_rb_ro_test_db > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Test database is ready"

# Run migrations on test database
echo "📦 Running migrations on test database..."
bun run drizzle-kit migrate --config ./drizzle.config.ts

echo "✅ Test database schema created successfully"

# Optional: Seed with minimal test data
# echo "🌱 Seeding test database with minimal data..."
# bun run ./scripts/seed-test-db.ts

echo "✨ Test database setup complete!"
echo ""
echo "📊 Database Info:"
echo "  Host: localhost"
echo "  Port: 9877"
echo "  Database: plati_rb_ro_test_db"
echo "  User: plati_rb_ro_test_user"
echo ""
echo "🧪 You can now run e2e tests with: bun run test:e2e"
