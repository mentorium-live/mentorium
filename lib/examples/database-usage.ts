import { prisma } from '../prisma'
import { supabase } from '../supabase-client'
import { supabaseAdmin } from '../supabase-admin'
import DatabaseService from '../database'

// Example 1: Using Prisma for CRUD operations
export async function examplePrismaUsage() {
  try {
    // Create a user
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    })

    // Create a post for the user
    const post = await prisma.post.create({
      data: {
        title: 'My First Post',
        content: 'This is my first post content',
        published: true,
        authorId: user.id,
      },
    })

    // Get user with posts
    const userWithPosts = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        Post: true,
        Profile: true,
      },
    })

    return { user, post, userWithPosts }
  } catch (error) {
    console.error('Prisma operation failed:', error)
    throw error
  }
}

// Example 2: Using Supabase for authentication
export async function exampleSupabaseAuth() {
  try {
    // Sign up a user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'user@example.com',
      password: 'password123',
    })

    if (signUpError) throw signUpError

    // Sign in a user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'user@example.com',
      password: 'password123',
    })

    if (signInError) throw signInError

    return { signUpData, signInData }
  } catch (error) {
    console.error('Supabase auth failed:', error)
    throw error
  }
}

// Example 3: Using Supabase for real-time features
export async function exampleSupabaseRealtime() {
  try {
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'Post' },
        (payload) => {
          console.log('Real-time change:', payload)
        }
      )
      .subscribe()

    return subscription
  } catch (error) {
    console.error('Supabase real-time failed:', error)
    throw error
  }
}

// Example 4: Using DatabaseService for unified access
export async function exampleDatabaseService() {
  try {
    // Health check
    const health = await DatabaseService.healthCheck()
    console.log('Database health:', health)

    // Use Prisma through service
    const users = await DatabaseService.getPrisma().user.findMany()

    // Use Supabase through service
    const { data: posts } = await DatabaseService.getSupabase()
      .from('Post')
      .select('*')

    return { health, users, posts }
  } catch (error) {
    console.error('Database service failed:', error)
    throw error
  }
}

// Example 5: Error handling and connection management
export async function exampleErrorHandling() {
  try {
    // Test connection
    const health = await DatabaseService.healthCheck()
    
    if (health.prisma === 'error' || health.supabase === 'error') {
      throw new Error('Database connection failed')
    }

    // Perform operations
    const result = await examplePrismaUsage()
    
    return result
  } catch (error) {
    console.error('Operation failed:', error)
    
    // Graceful shutdown
    await DatabaseService.disconnect()
    
    throw error
  }
} 