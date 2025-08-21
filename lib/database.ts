import { prisma } from './prisma'
import { supabase } from './supabase-client'
import { supabaseAdmin } from './supabase-admin'

// Database connection utilities
export class DatabaseService {
  // Prisma client for ORM operations
  static getPrisma() {
    return prisma
  }

  // Supabase client for auth and real-time features
  static getSupabase() {
    return supabase
  }

  // Supabase admin client for server-side operations
  static getSupabaseAdmin() {
    return supabaseAdmin
  }

  // Health check for database connections
  static async healthCheck() {
    try {
      // Test Prisma connection
      await prisma.$queryRaw`SELECT 1`
      
      // Test Supabase connection
      const { data, error } = await supabase.from('_dummy_').select('*').limit(1)
      
      return {
        prisma: 'connected',
        supabase: error ? 'error' : 'connected',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        prisma: 'error',
        supabase: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Graceful shutdown
  static async disconnect() {
    await prisma.$disconnect()
  }
}

export default DatabaseService 