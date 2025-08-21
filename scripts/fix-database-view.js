const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseView() {
  try {
    console.log('Fixing student_lecturer_pairs view...');
    
    // Drop the existing view
    const { error: dropError } = await supabase
      .from('student_lecturer_pairs')
      .select('*')
      .limit(1);
    
    if (dropError) {
      console.log('View does not exist or cannot be accessed, creating new view...');
    }

    // Create the new view using raw SQL
    const createViewSQL = `
      CREATE OR REPLACE VIEW public.student_lecturer_pairs AS
      SELECT 
        p.id as pairing_id,
        s.id as student_id,
        s.index_number,
        concat(s.firstname, ' ', s.lastname) as student_name,
        s.current_cwa,
        s.year_of_admission,
        l.id as lecturer_id,
        CASE 
          WHEN l.firstname IS NOT NULL AND l.lastname IS NOT NULL 
          THEN concat(l.firstname, ' ', l.lastname)
          ELSE 'Unassigned'
        END as lecturer_name,
        s.department,
        p.paired_at,
        CASE 
          WHEN p.status IS NOT NULL THEN p.status
          ELSE 'unassigned'
        END as status
      FROM public.students s
      LEFT JOIN public.pairings p ON s.id = p.student_id AND p.status = 'active'
      LEFT JOIN public.lecturers l ON p.lecturer_id = l.id;
    `;

    // Execute the SQL using the REST API
    const { error: createError } = await supabase
      .rpc('exec_sql', { sql: createViewSQL });
    
    if (createError) {
      console.error('Error creating view:', createError);
      console.log('Trying alternative approach...');
      
      // Try to test the view directly
      const { data, error: testError } = await supabase
        .from('student_lecturer_pairs')
        .select('*')
        .limit(5);
      
      if (testError) {
        console.error('View test failed:', testError);
        console.log('You may need to run the SQL manually in your Supabase dashboard');
      } else {
        console.log('View appears to be working. Sample data:', data);
      }
    } else {
      console.log('Database view created successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDatabaseView();
