#!/bin/bash

echo "🎨 Setting up Generative Instagram AI..."
echo "========================================"

# Check if Node.js 20+ is installed
node_version=$(node --version | cut -d'.' -f1 | tr -d 'v')
if [ "$node_version" -lt 20 ]; then
    echo "❌ Node.js 20+ is required. Current version: $(node --version)"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "⚠️  Please edit .env file with your actual credentials:"
        echo "   - DATABASE_URL (Neon PostgreSQL)"
        echo "   - OPENAI_API_KEY"
        read -p "Press Enter after editing .env file..."
    else
        echo "DATABASE_URL=\"postgresql://username:password@ep-example.neon.tech/instagram?sslmode=require\"" > .env
        echo "OPENAI_API_KEY=\"sk-your-key-here\"" >> .env
        echo "NEXT_PUBLIC_APP_URL=\"http://localhost:3000\"" >> .env
        echo "⚠️  Created .env file. Please edit it with your credentials."
        read -p "Press Enter after editing .env file..."
    fi
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo ""
echo "⚙️  Generating Prisma Client..."
npx prisma generate

# Create and run migration
echo ""
echo "🗄️  Creating database migration..."
npx prisma migrate dev --name init

# Seed the database
echo ""
echo "🌱 Seeding database..."
node prisma/seed.js

echo ""
echo "========================================"
echo "✅ Setup complete!"
echo ""
echo "🚀 Start the app:"
echo "   npm run dev"
echo ""
echo "🌐 Open in browser:"
echo "   http://localhost:3000"
echo ""
echo "📁 Project structure:"
echo "   /app           - Next.js app pages and API"
echo "   /prisma        - Database schema and config"
echo "   /docs          - Documentation"
echo "   .env           - Environment variables (DO NOT COMMIT)"
echo ""
echo "💡 Next steps:"
echo "   1. Generate images at http://localhost:3000"
echo "   2. View feed at http://localhost:3000/feed"
echo "   3. Use Prisma Studio to view data: npx prisma studio"
echo ""