# Supabase + Prisma Troubleshooting Guide

## Common Issues and Solutions

### 1. "s1" Prepared Statement Error

**Problem**: `ERROR: prepared statement "s1" already exists`

**Solutions**:
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
npm install
npx prisma generate

# Use direct connection instead of pooled
# In .env.local, change:
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-eu-north-1.supabase.com:5432/postgres
# Instead of:
# DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
```

### 2. Connection Timeout Issues

**Problem**: Database connection timeouts

**Solutions**:
```bash
# Add connection timeout to DATABASE_URL
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-eu-north-1.supabase.com:5432/postgres?connect_timeout=10&pool_timeout=10

# Or use connection pooling with proper settings
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0
```

### 3. Schema Introspection Failures

**Problem**: `prisma db pull` fails

**Solutions**:
```bash
# Use direct connection for introspection
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-eu-north-1.supabase.com:5432/postgres

# Clear and regenerate
npx prisma generate
npx prisma db pull

# If still failing, try manual schema update
```

### 4. Authentication Issues

**Problem**: Supabase auth not working with Prisma

**Solutions**:
```typescript
// Use separate clients for different purposes
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase-client'

// For auth: use Supabase
const { data: { user } } = await supabase.auth.getUser()

// For data: use Prisma
const userData = await prisma.user.findUnique({
  where: { email: user?.email }
})
```

### 5. Real-time Features Not Working

**Problem**: Supabase real-time subscriptions failing

**Solutions**:
```typescript
// Ensure proper channel setup
const subscription = supabase
  .channel('table-db-changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'YourTable' 
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Clean up on unmount
return () => {
  subscription.unsubscribe()
}
```

### 6. Migration Issues

**Problem**: Prisma migrations failing

**Solutions**:
```bash
# Reset migrations
npx prisma migrate reset

# Create fresh migration
npx prisma migrate dev --name init

# Push schema without migrations
npx prisma db push

# Check migration status
npx prisma migrate status
```

### 7. Environment Variable Issues

**Problem**: Environment variables not loading

**Solutions**:
```bash
# Ensure .env.local exists and has correct format
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DATABASE_URL=your_database_url

# Restart development server
npm run dev
```

### 8. Performance Issues

**Problem**: Slow database operations

**Solutions**:
```typescript
// Use connection pooling for production
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true

// Implement proper indexing
// Add to your schema.prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  
  @@index([email])
}
```

## Debugging Commands

```bash
# Test database connection
npx prisma db pull --print

# Check Prisma client generation
npx prisma generate

# View database in Prisma Studio
npx prisma studio

# Test Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
supabase.from('_dummy_').select('*').limit(1).then(console.log).catch(console.error)
"
```

## Best Practices

1. **Use direct connection for schema operations**
2. **Use pooled connection for production queries**
3. **Separate auth (Supabase) from data (Prisma)**
4. **Implement proper error handling**
5. **Use connection pooling in production**
6. **Monitor connection limits**
7. **Implement graceful shutdowns**

## Health Check Implementation

```typescript
// Add to your API routes
import DatabaseService from '@/lib/database'

export async function GET() {
  const health = await DatabaseService.healthCheck()
  return Response.json(health)
}
``` 