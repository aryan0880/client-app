#!/bin/sh
set -e

echo "🔍 Running Prisma schema sync..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo "🚀 Starting FoodScan AI API server..."
exec node dist/app.js
