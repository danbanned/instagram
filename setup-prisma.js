const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Generative Instagram AI...\n');

// Check if we're using Prisma 7
try {
  const prismaVersion = execSync('npx prisma --version', { stdio: 'pipe' }).toString();
  console.log(`📦 Detected: ${prismaVersion}`);
} catch (error) {
  console.log('⚠️  Prisma not detected in PATH');
}

// Create .env from example if .env doesn't exist
if (!fs.existsSync('.env') && fs.existsSync('.env.example')) {
  console.log('📝 Creating .env file from .env.example...');
  fs.copyFileSync('.env.example', '.env');
  console.log('⚠️  Please edit .env file with your actual credentials!');
  console.log('   - DATABASE_URL: Your Neon PostgreSQL connection string');
  console.log('   - OPENAI_API_KEY: Your OpenAI API key');
  console.log('\n   Then run: npm run setup again');
  process.exit(1);
}

if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found. Please create it with your credentials.');
  console.log('   You can copy .env.example to .env');
  process.exit(1);
}

try {
  // Step 1: Check Prisma schema
  console.log('\n📋 Step 1: Checking Prisma schema...');
  if (!fs.existsSync('prisma/schema.prisma')) {
    console.log('❌ prisma/schema.prisma not found!');
    process.exit(1);
  }
  
  // Step 2: Generate Prisma Client
  console.log('\n📦 Step 2: Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated');

  // Step 3: Create database schema using db push (simpler than migrate)
  console.log('\n🗄️ Step 3: Creating database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Database schema created');

  // Step 4: Seed the database
  console.log('\n🌱 Step 4: Seeding database...');
  if (fs.existsSync('prisma/seed.js')) {
    execSync('node prisma/seed.js', { stdio: 'inherit' });
    console.log('✅ Database seeded');
  } else {
    console.log('⚠️  prisma/seed.js not found, skipping seeding');
  }

  console.log('\n🎉 Setup completed successfully!');
  console.log('\n👉 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open http://localhost:3000 in your browser');
  console.log('   3. Generate your first AI image!');

} catch (error) {
  console.error('\n❌ Setup failed!');
  console.error('Error:', error.message);
  
  console.log('\n🔧 Try these manual troubleshooting steps:');
  console.log('1. Check your .env file has correct DATABASE_URL');
  console.log('2. Manually run: npx prisma generate');
  console.log('3. Check Prisma schema syntax: npx prisma validate');
  
  process.exit(1);
}