-- Fix the student_lecturer_pairs view to include all students including unassigned ones
-- Drop the view if it exists
drop view if exists public.student_lecturer_pairs;

-- Create the view with correct column names and include unassigned students
create or replace view public.student_lecturer_pairs as
select 
  p.id as pairing_id,
  s.id as student_id,
  s.index_number,
  concat(s.firstname, ' ', s.lastname) as student_name,
  s.current_cwa,
  s.year_of_admission,
  l.id as lecturer_id,
  case 
    when l.firstname is not null and l.lastname is not null 
    then concat(l.firstname, ' ', l.lastname)
    else 'Unassigned'
  end as lecturer_name,
  s.department,
  p.paired_at,
  case 
    when p.status is not null then p.status
    else 'unassigned'
  end as status
from public.students s
left join public.pairings p on s.id = p.student_id and p.status = 'active'
left join public.lecturers l on p.lecturer_id = l.id;
