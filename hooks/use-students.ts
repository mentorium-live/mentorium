import useSWR from 'swr'

export interface Student {
  pairing_id: string | null
  student_id: string
  index_number: string
  student_name: string
  current_cwa: number | null
  year_of_admission: number
  lecturer_id: string | null
  lecturer_name: string | null
  department: string | null
  paired_at: string | null
  status: string | null
}

async function fetchStudents() {
  const res = await fetch('/api/students')
  if (!res.ok) throw new Error('Failed to fetch students')
  return res.json() as Promise<Student[]>
}

export function useStudents() {
  const { data, error, isLoading, mutate } = useSWR('students', fetchStudents, {
    refreshInterval: 30_000, // keep fresh every 30s
  })

  return {
    students: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
} 