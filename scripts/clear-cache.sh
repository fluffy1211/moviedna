#!/bin/bash

# MovieDNA Cache Clearing Script
echo "🧹 Clearing Next.js and development caches..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Please run this script from the project root directory"
  exit 1
fi

# Stop any running development server (optional)
echo "Stopping any running Next.js processes..."
pkill -f "next dev" 2>/dev/null || true

# Clear Next.js build cache
echo "📁 Clearing .next directory..."
rm -rf .next

# Clear node modules cache
echo "📦 Clearing node_modules cache..."
rm -rf node_modules/.cache

# Clear npm cache
echo "🔄 Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Clear TypeScript build info
echo "📝 Clearing TypeScript build cache..."
rm -f tsconfig.tsbuildinfo

# Clear any jest cache (if you have tests)
if [ -d ".jest" ]; then
  echo "🧪 Clearing Jest cache..."
  rm -rf .jest
fi

# Clear any ESLint cache
if [ -f ".eslintcache" ]; then
  echo "✨ Clearing ESLint cache..."
  rm -f .eslintcache
fi

# Clear any Prettier cache
if [ -f ".prettier-cache" ]; then
  echo "💄 Clearing Prettier cache..."
  rm -f .prettier-cache
fi

# Clear any Turbo cache
if [ -d ".turbo" ]; then
  echo "⚡ Clearing Turbo cache..."
  rm -rf .turbo
fi

# Clear any SWC cache
if [ -d ".swc" ]; then
  echo "🚀 Clearing SWC cache..."
  rm -rf .swc
fi

echo ""
echo "✅ All caches cleared successfully!"
echo "🚀 You can now restart your development server with:"
echo "   npm run dev"
echo "" 