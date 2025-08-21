import { supabase } from '../lib/supabase-client'

async function checkSupabaseLecturers() {
  try {
    console.log('Checking Supabase lecturers table...\n')
    
    // Check if lecturers table exists and get current data
    const { data: lecturers, error } = await supabase
      .from('lecturers')
      .select('*')
      .order('firstname')
    
    if (error) {
      console.error('Error fetching lecturers:', error)
      return
    }
    
    if (!lecturers || lecturers.length === 0) {
      console.log('No lecturers found in the database.')
      console.log('The lecturers table is empty.')
    } else {
      console.log(`Found ${lecturers.length} lecturers in the database:\n`)
      lecturers.forEach((lecturer, index) => {
        console.log(`${index + 1}. ${lecturer.firstname} ${lecturer.lastname}`)
        console.log(`   Email: ${lecturer.email}`)
        console.log(`   Department: ${lecturer.department}`)
        console.log(`   Status: ${lecturer.status}`)
        console.log(`   Created: ${lecturer.created_at}`)
        console.log('')
      })
    }
    
    // Check table structure
    console.log('Checking table structure...')
    const { data: structure, error: structureError } = await supabase
      .from('lecturers')
      .select('*')
      .limit(1)
    
    if (structureError) {
      console.error('Error checking table structure:', structureError)
    } else {
      console.log('Table structure is accessible.')
    }
    
  } catch (error) {
    console.error('Script failed:', error)
  }
}

checkSupabaseLecturers() 