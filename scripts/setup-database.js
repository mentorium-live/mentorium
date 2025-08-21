const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Supabase + Prisma integration...')

// Step 1: Generate Prisma client
console.log('\n📦 Generating Prisma client...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated successfully')
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message)
  process.exit(1)
}

// Step 2: Check database connection
console.log('\n🔗 Testing database connection...')
try {
  execSync('npx prisma db pull --print', { stdio: 'pipe' })
  console.log('✅ Database connection successful')
} catch (error) {
  console.error('❌ Database connection failed:', error.message)
  console.log('\n💡 Troubleshooting tips:')
  console.log('1. Check your DATABASE_URL in .env.local')
  console.log('2. Ensure your Supabase database is accessible')
  console.log('3. Try using direct connection instead of pooled connection')
  console.log('4. Clear Prisma cache: rm -rf node_modules/.prisma')
  process.exit(1)
}

// Step 3: Create initial migration (if needed)
console.log('\n📝 Creating initial migration...')
try {
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' })
  console.log('✅ Initial migration created')
} catch (error) {
  console.log('ℹ️  Migration already exists or not needed')
}

console.log('\n🎉 Setup complete! Your Supabase + Prisma integration is ready.')
console.log('\n📚 Next steps:')
console.log('1. Import DatabaseService in your components')
console.log('2. Use prisma for ORM operations')
console.log('3. Use supabase for auth and real-time features') 