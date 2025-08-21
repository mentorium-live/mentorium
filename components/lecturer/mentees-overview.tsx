"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, 
  TrendingUp, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Trophy,
  AlertTriangle,
  Star,
  Calendar,
} from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/components/auth-provider"

type SortField = "name" | "index_number" | "cwa" | "year"
type SortDirection = "asc" | "desc"

interface StudentWithMentor {
  index_number: string
  name: string
  cwa: number
  year: number
  trend?: "up" | "down" | "stable"
  semesterHistory?: Array<{ semester: string; cwa: number }>
}

// Mentees will be derived from store based on current lecturer (placeholder selects first lecturer for now)

const getPerformanceBadgeColor = (cwa: number) => {
  if (cwa >= 70) return "bg-green-50 text-green-700 border-green-200"
  if (cwa >= 60) return "bg-blue-50 text-blue-700 border-blue-200"
  if (cwa >= 50) return "bg-yellow-50 text-yellow-700 border-yellow-200"
  return "bg-red-50 text-red-700 border-red-200"
}

const getPerformanceIcon = (cwa: number) => {
  if (cwa >= 70) return <Trophy className="w-3 h-3" />
  if (cwa >= 60) return <Star className="w-3 h-3" />
  if (cwa >= 50) return <UserCheck className="w-3 h-3" />
  return <AlertTriangle className="w-3 h-3" />
}

// Trend column removed for simplicity in the mentees table

const getYearLabel = (year: number) => {
  const suffixes = ['st', 'nd', 'rd', 'th']
  const suffix = suffixes[year - 1] || 'th'
  return `${year}${suffix} Year`
}

export default function LecturerMentees() {
  const [sortField, setSortField] = useState<SortField>("cwa")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [performanceFilter, setPerformanceFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [mentees, setMentees] = useState<StudentWithMentor[]>([])
  const [loading, setLoading] = useState(true)

  const { user, loading: authLoading } = useAuth()

  // Fetch mentees from database for the logged-in lecturer
  useEffect(() => {
    const fetchMenteesForLecturer = async (lecturerEmail: string) => {
      setLoading(true)
      try {
        // Use server API backed by Prisma to avoid client-side RLS/joins issues
        const res = await fetch(`/api/lecturer/mentees?email=${encodeURIComponent(lecturerEmail)}`)
        if (!res.ok) {
          console.error('Failed to fetch mentees via API:', res.status, res.statusText)
          setMentees([])
          return
        }
        const payload = await res.json()
        const menteesData: StudentWithMentor[] = (payload.mentees || []).map((s: any) => ({
          index_number: s.index_number,
          name: `${s.firstname} ${s.lastname}`,
          cwa: s.current_cwa || 0,
          year: s.year,
          trend: 'stable',
        }))
        setMentees(menteesData)
      } catch (err) {
        console.error('Unexpected error fetching mentees:', err)
        setMentees([])
      } finally {
        setLoading(false)
      }
    }

    if (authLoading) return
    if (!user?.email) {
      setMentees([])
      setLoading(false)
      return
    }

    fetchMenteesForLecturer(user.email)
  }, [authLoading, user?.email])

  // Calculate statistics by year
  const yearStats = useMemo(() => {
    const stats = mentees.reduce((acc, student) => {
      if (!acc[student.year]) {
        acc[student.year] = { count: 0, avgCwa: 0, totalCwa: 0 }
      }
      acc[student.year].count++
      acc[student.year].totalCwa += student.cwa
      acc[student.year].avgCwa = acc[student.year].totalCwa / acc[student.year].count
      return acc
    }, {} as Record<number, { count: number; avgCwa: number; totalCwa: number }>)
    
    return Object.entries(stats).map(([year, data]) => ({
      year: parseInt(year),
      ...data
    })).sort((a, b) => a.year - b.year)
  }, [mentees])

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalMentees = mentees.length
    const sumCwa = mentees.reduce((sum, student) => sum + student.cwa, 0)
    const avgCwa = totalMentees > 0 ? sumCwa / totalMentees : 0

    const cwaValues = mentees.map(s => s.cwa)
    const highestCwa = cwaValues.length > 0 ? Math.max(...cwaValues) : 0
    const lowestCwa = cwaValues.length > 0 ? Math.min(...cwaValues) : 0

    const excellentCount = mentees.filter(s => s.cwa >= 70).length
    const needsAttentionCount = mentees.filter(s => s.cwa < 50).length

    const excellentPercent = totalMentees > 0 ? (excellentCount / totalMentees) * 100 : 0
    const needsPercent = totalMentees > 0 ? (needsAttentionCount / totalMentees) * 100 : 0

    return {
      totalMentees,
      avgCwa,
      highestCwa,
      lowestCwa,
      excellentCount,
      needsAttentionCount,
      excellentPercent,
      needsPercent,
    }
  }, [mentees])

  // Apply filters and sorting
  const filteredAndSortedMentees = useMemo(() => {
    let filtered = mentees

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.index_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply performance filter
    if (performanceFilter !== "all") {
      filtered = filtered.filter(student => {
        const cwa = student.cwa
        switch (performanceFilter) {
          case "excellent": return cwa >= 70
          case "good": return cwa >= 60 && cwa < 70
          case "fair": return cwa >= 50 && cwa < 60
          case "needs-attention": return cwa < 50
          default: return true
        }
      })
    }

    // Apply year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(student => student.year.toString() === yearFilter)
    }

    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "index_number":
          aValue = a.index_number.toLowerCase()
          bValue = b.index_number.toLowerCase()
          break
        case "cwa":
          aValue = a.cwa
          bValue = b.cwa
          break
        case "year":
          aValue = a.year
          bValue = b.year
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [mentees, searchTerm, performanceFilter, yearFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMentees.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentMentees = filteredAndSortedMentees.slice(startIndex, endIndex)

  // Sorting handlers
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="w-4 h-4" />
    return sortDirection === "asc" 
      ? <ArrowUp className="w-4 h-4" /> 
      : <ArrowDown className="w-4 h-4" />
  }

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Mentees</h1>
        <p className="text-muted-foreground">
          Overview of all students assigned to your mentorship across all academic years
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Mentees</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{overallStats.totalMentees}</p>
              <p className="text-xs text-slate-500 mt-1">Across {yearStats.length} academic years</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-slate-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Average CWA</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{overallStats.avgCwa.toFixed(1)}</p>
              <p className="text-xs text-slate-500 mt-1">Range: {overallStats.lowestCwa.toFixed(1)} - {overallStats.highestCwa.toFixed(1)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Excellent Performance</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{overallStats.excellentCount}</p>
              <p className="text-xs text-slate-500 mt-1">{overallStats.excellentPercent.toFixed(1)}% with CWA ≥ 70</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Needs Attention</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{overallStats.needsAttentionCount}</p>
              <p className="text-xs text-slate-500 mt-1">{overallStats.needsPercent.toFixed(1)}% with CWA &lt; 50</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent pointer-events-none"></div>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or index number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance Levels</SelectItem>
                <SelectItem value="excellent">🟢 Excellent (70+)</SelectItem>
                <SelectItem value="good">🔵 Good (60-69)</SelectItem>
                <SelectItem value="fair">🟡 Fair (50-59)</SelectItem>
                <SelectItem value="needs-attention">🔴 Needs Attention (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {[1, 2, 3, 4].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {getYearLabel(year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          
      </div>

      {/* Mentees Table */}

      <div className="rounded-md border mt-2">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>#</TableHead>
              <TableHead className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("index_number")}> <div className="flex items-center gap-2">Index # {getSortIcon("index_number")}</div></TableHead>
              <TableHead className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("name")}> <div className="flex items-center gap-2">Name {getSortIcon("name")}</div></TableHead>
              <TableHead className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("year")}> <div className="flex items-center gap-2">Year {getSortIcon("year")}</div></TableHead>
              <TableHead className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("cwa")}> <div className="flex items-center gap-2">Current CWA {getSortIcon("cwa")}</div></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading mentees...
                </TableCell>
              </TableRow>
            ) : currentMentees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  You don't have any mentees yet. Once students are paired to you, they'll appear here.
                </TableCell>
              </TableRow>
            ) : (
              currentMentees.map((student, index) => (
                <TableRow key={student.index_number} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{startIndex + index + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{student.index_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{student.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{student.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">Year {student.year}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs gap-1 ${getPerformanceBadgeColor(student.cwa)}`}>{getPerformanceIcon(student.cwa)}{student.cwa.toFixed(1)}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end text-sm text-muted-foreground">
        Showing {currentMentees.length} of {filteredAndSortedMentees.length} mentees
      </div>
      
      {/* Pagination */}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => {
                    setRowsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 30, 50].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
    </div>
  )
} 