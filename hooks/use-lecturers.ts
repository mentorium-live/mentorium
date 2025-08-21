import useSWR from 'swr'

export interface LecturerRow {
  id: string
  firstname: string
  lastname: string
  email: string | null
  department: string | null
  status: string | null
  created_at: string
}

async function fetchLecturers() {
  const response = await fetch('/api/lecturers')
  if (!response.ok) {
    throw new Error('Failed to fetch lecturers')
  }
  return response.json() as Promise<LecturerRow[]>
}

export function useLecturers() {
  const { data, error, isLoading, mutate } = useSWR('lecturers', fetchLecturers, {
    refreshInterval: 30_000,
  })
  return {
    lecturers: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
} 