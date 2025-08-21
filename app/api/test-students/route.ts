import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
  try {
    // Test 1: Check if students table exists and has data
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(5);
    
    // Test 2: Check if lecturers table exists and has data
    const { data: lecturers, error: lecturersError } = await supabase
      .from('lecturers')
      .select('*')
      .limit(5);
    
    // Test 3: Check if pairings table exists and has data
    const { data: pairings, error: pairingsError } = await supabase
      .from('pairings')
      .select('*')
      .limit(5);
    
    // Test 4: Try to access the view
    const { data: viewData, error: viewError } = await supabase
      .from('student_lecturer_pairs')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      students: { data: students, error: studentsError?.message },
      lecturers: { data: lecturers, error: lecturersError?.message },
      pairings: { data: pairings, error: pairingsError?.message },
      view: { data: viewData, error: viewError?.message }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
