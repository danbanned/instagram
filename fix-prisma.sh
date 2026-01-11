#!/bin/bash

echo "🔧 Fixing Prisma Configuration"
echo "=============================="

# 1. Remove any problematic Prisma files
echo "1. Cleaning up..."
rm -f prisma.config.js prisma.config.ts 2>/dev/null
rm -rf .prisma 2>/dev/null

# 2. Check package.json versions
echo "2. Checking versions..."
echo "   Prisma should be 7.2.0"
echo "   @prisma/client should be 7.2.0"

# 3. Remove node_modules cache
echo "3. Clearing Prisma cache..."
rm -rf node_modules/.prisma node_modules/@prisma 2>/dev/null

# 4. Reinstall if needed
echo "4. Reinstalling Prisma..."
npm list prisma 2>/dev/null || npm install prisma@7.2.0 --save-dev
npm list @prisma/client 2>/dev/null || npm install @prisma/client@7.2.0 --save

# 5. Generate Prisma Client
echo "5. Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Fix applied!"
echo ""
echo "📝 Next: Run setup again:"
echo "   npm run setup"