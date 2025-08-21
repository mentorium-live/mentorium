"use client"

import { useStudents } from "@/hooks/use-students"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  TrendingDown, 
  Minus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  FileText,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Trash2,
} from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useLecturers } from "@/hooks/use-lecturers"

type SortField = "name" | "index_number" | "cwa" | "lecturerName" | "year" | "department"
type SortDirection = "asc" | "desc"

interface StudentWithMentor {
  id: string
  index_number: string
  name: string  // firstname + lastname
  cwa: number | null
  year: number
  department?: string | null
  lecturerName: string
  lecturerId?: string | null
}

// Data will be derived from store instead of mock

export default function StudentsDirectory() {
  const { students: dbStudents, isLoading, refresh } = useStudents()
  const { lecturers } = useLecturers()
  
  // Force refresh when coming from upload page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('refresh') === 'true') {
      console.log('Forcing refresh due to upload redirect')
      refresh()
      // Clean up the URL
      window.history.replaceState({}, '', '/coordinator/students')
      // Show success message
      toast.success('✅ Students data refreshed successfully!')
    }
  }, [refresh])

  // Debug: Log when students data changes
  useEffect(() => {
    console.log('Students data updated:', dbStudents.length, 'students')
    if (dbStudents.length > 0) {
      console.log('Sample student:', dbStudents[0])
    }
  }, [dbStudents])
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>("")

  const [sortField, setSortField] = useState<SortField>("cwa")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [performanceFilter, setPerformanceFilter] = useState<string>("all")
  const [lecturerFilter, setLecturerFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [studentForm, setStudentForm] = useState({
    index_number: "",
    firstname: "",
    lastname: "",
    cwa: "",
    year_of_study: "1",
    department: "",
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const resetStudentForm = () => {
    setStudentForm({ index_number: "", firstname: "", lastname: "", cwa: "", year_of_study: "1", department: "" })
  }

  const handleAddStudent = async () => {
    if (!studentForm.index_number.trim() || !studentForm.firstname.trim() || !studentForm.lastname.trim()) {
      toast.error("Index Number, First Name, and Last Name are required")
      return
    }
    
    // Validate Index Number (digits only, 6-10 len acceptable)
    const indexNumber = studentForm.index_number.trim()
    if (!/^\d{6,10}$/.test(indexNumber)) {
      toast.error("Index Number must be 6-10 digits")
      return
    }
    
    const cwa = parseFloat(studentForm.cwa)
    if (isNaN(cwa) || cwa < 0 || cwa > 100) {
      toast.error("CWA must be between 0 and 100")
      return
    }
    
    const currentYear = new Date().getFullYear()
    const yearOfStudy = parseInt(studentForm.year_of_study, 10)
    const admissionYear = currentYear - yearOfStudy + 1

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index_number: indexNumber,
          firstname: studentForm.firstname.trim(),
          lastname: studentForm.lastname.trim(),
          year_of_admission: admissionYear,
          current_cwa: cwa,
          department: studentForm.department || undefined,
        })
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || 'Failed to add student')
        return
      }
      toast.success("Student added successfully")
      await refresh()
      setIsAddDialogOpen(false)
      resetStudentForm()
    } catch (e) {
      toast.error('Failed to add student')
    }
  }

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAllCurrentPage = (ids: string[]) => {
    const allSelected = ids.every(id => selectedIds.has(id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        ids.forEach(id => next.delete(id))
      } else {
        ids.forEach(id => next.add(id))
      }
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} selected students? This cannot be undone.`)) return
    const idsArr = Array.from(selectedIds)
    try {
      await Promise.all(idsArr.map(id => fetch(`/api/students?id=${encodeURIComponent(id)}`, { method: 'DELETE' })))
      toast.success(`Deleted ${idsArr.length} students`)
      setSelectedIds(new Set())
      refresh()
    } catch (e) {
      toast.error('Failed to delete some students')
    }
  }

  const handleAssignMentor = async () => {
    if (!selectedLecturerId || selectedIds.size === 0) return
    // Map selected student IDs to index_numbers for API
    const indexNumbers = studentsWithMentors
      .filter(s => selectedIds.has(s.id))
      .map(s => s.index_number)

    const payload = indexNumbers.map(idx => ({ student_index_number: idx, lecturer_id: selectedLecturerId }))
    try {
      const res = await fetch('/api/pairings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairings: payload })
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || 'Failed to assign mentors')
        return
      }
      toast.success(`Assigned ${selectedIds.size} student(s) to mentor`)
      setSelectedIds(new Set())
      setAssignDialogOpen(false)
      setSelectedLecturerId("")
      refresh()
    } catch (e) {
      toast.error('Failed to assign mentors')
    }
  }

  // Merge students with their assigned lecturer name
  const studentsWithMentors: StudentWithMentor[] = useMemo(() => {
    const currentYear = new Date().getFullYear()
    console.log('Processing students data:', dbStudents.length, 'students')
    return dbStudents.map((row) => {
      const yearOfStudy = Math.max(1, currentYear - (row.year_of_admission ?? currentYear) + 1)
      return {
        id: row.student_id,
        index_number: row.index_number,
        name: row.student_name,
        cwa: row.current_cwa,
        year: yearOfStudy,
        department: row.department,
        lecturerName: row.lecturer_name || 'Unassigned',
        lecturerId: row.lecturer_id ?? null,
      }
    })
  }, [dbStudents])

  // Apply filters and sorting
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = studentsWithMentors

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
        if (!cwa) return false // Skip students with no CWA
        switch (performanceFilter) {
          case "excellent": return cwa >= 70
          case "good": return cwa >= 60 && cwa < 70
          case "fair": return cwa >= 50 && cwa < 60
          case "needs-attention": return cwa < 50
          default: return true
        }
      })
    }

    // Apply lecturer filter
    if (lecturerFilter !== "all") {
      filtered = filtered.filter(student => student.lecturerName === lecturerFilter)
    }

    // Apply year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(student => student.year.toString() === yearFilter)
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(student => student.department === departmentFilter)
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
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
        case "lecturerName":
          aValue = a.lecturerName.toLowerCase()
          bValue = b.lecturerName.toLowerCase()
          break
        case "year":
          aValue = a.year
          bValue = b.year
          break
        case "department":
          aValue = a.department || ""
          bValue = b.department || ""
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [studentsWithMentors, searchTerm, performanceFilter, lecturerFilter, yearFilter, departmentFilter, sortField, sortDirection])

  // Pagination logic
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedStudents.length / rowsPerPage) || 1
  }, [filteredAndSortedStudents, rowsPerPage])

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return filteredAndSortedStudents.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredAndSortedStudents, currentPage, rowsPerPage])

  // Get unique options for filters
  const lecturerOptions = useMemo(() => {
    const lecturers = [...new Set(studentsWithMentors.map(s => s.lecturerName))].filter(l => l !== "Unassigned")
    return lecturers.sort()
  }, [studentsWithMentors])

  const yearOptions = useMemo(() => {
    const years = [...new Set(studentsWithMentors.map(s => s.year))]
    // Filter out unrealistic years (keep only years 1-4)
    const validYears = years.filter(year => year >= 1 && year <= 4)
    return validYears.sort()
  }, [studentsWithMentors])

  const departmentOptions = useMemo(() => {
    const departments = [...new Set(studentsWithMentors.map(s => s.department).filter(Boolean))]
    return departments.sort()
  }, [studentsWithMentors])

  const getPerformanceBadgeColor = (cwa: number | null) => {
    if (!cwa) return "bg-gray-100 text-gray-800 border-gray-200"
    if (cwa >= 70) return "bg-green-100 text-green-800 border-green-200"
    if (cwa >= 60) return "bg-blue-100 text-blue-800 border-blue-200"  
    if (cwa >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getPerformanceIcon = (cwa: number | null) => {
    if (!cwa) return <Minus className="w-3 h-3" />
    if (cwa >= 70) return <TrendingUp className="w-3 h-3" />
    if (cwa >= 60) return <Minus className="w-3 h-3" />
    return <TrendingDown className="w-3 h-3" />
  }

  const getPerformanceLabel = (cwa: number | null) => {
    if (!cwa) return 'No Data'
    if (cwa >= 70) return 'Excellent'
    if (cwa >= 60) return 'Good'
    if (cwa >= 50) return 'Fair'
    return 'Needs Attention'
  }

  const getLecturerInitials = (name: string) => {
    if (name === "Unassigned") return "NA"
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAvatarColor = (lecturerName: string) => {
    if (lecturerName === "Unassigned") return "bg-gray-500"
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500"
    ]
    const index = lecturerOptions.indexOf(lecturerName)
    return colors[index % colors.length]
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }



  // Statistics
  const stats = useMemo(() => {
    const total = studentsWithMentors.length
    const assigned = studentsWithMentors.filter(s => s.lecturerId).length
    const unassigned = total - assigned
    const studentsWithCwa = studentsWithMentors.filter(s => s.cwa !== null && s.cwa !== undefined)
    const avgCwa = studentsWithCwa.length > 0 ? studentsWithCwa.reduce((sum, s) => sum + (s.cwa || 0), 0) / studentsWithCwa.length : 0
    
    return {
      total,
      assigned,
      unassigned,
      avgCwa: avgCwa.toFixed(1)
    }
  }, [studentsWithMentors])

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Students Directory</h1>
            <p className="text-muted-foreground">
              Loading students data...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students Directory</h1>
          <p className="text-muted-foreground">
            Manage and view all students with their academic performance and mentor assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if(!o) resetStudentForm() }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Enter details for the student.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Student ID removed */}
                <div className="grid gap-2">
                  <Label htmlFor="index">Index Number</Label>
                  <Input 
                    id="index" 
                    type="number"
                    value={studentForm.index_number} 
                    onChange={(e)=>setStudentForm(prev=>({...prev,index_number:e.target.value}))} 
                    placeholder="1234567" 
                    maxLength={7}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input id="firstname" value={studentForm.firstname} onChange={(e)=>setStudentForm(prev=>({...prev,firstname:e.target.value}))} placeholder="John" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input id="lastname" value={studentForm.lastname} onChange={(e)=>setStudentForm(prev=>({...prev,lastname:e.target.value}))} placeholder="Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cwa">CWA</Label>
                  <Input 
                    id="cwa" 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.01" 
                    value={studentForm.cwa} 
                    onChange={(e)=>setStudentForm(prev=>({...prev,cwa:e.target.value}))} 
                    placeholder="65.4" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Year of Study</Label>
                  <Select value={studentForm.year_of_study} onValueChange={(val)=>setStudentForm(prev=>({...prev,year_of_study:val}))}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Year of Study" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={studentForm.department} onValueChange={(val)=>setStudentForm(prev=>({...prev, department: val}))}>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                      <SelectItem value="Biomedical Engineering">Biomedical Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStudent}>Add Student</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedIds.size > 0 && (
            <>
              <Button variant="destructive" className="gap-2" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedIds.size})
              </Button>
              <Button className="gap-2" onClick={()=>setAssignDialogOpen(true)}>
                <Users className="w-4 h-4" />
                Assign Mentor
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Students</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
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
              <p className="text-sm font-medium text-slate-600">Assigned to Mentors</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.assigned}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Unassigned</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">{stats.unassigned}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Average CWA</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.avgCwa}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
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
          <Users className="w-4 h-4 text-muted-foreground" />
          <Select value={lecturerFilter} onValueChange={setLecturerFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by mentor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mentors</SelectItem>
              <SelectItem value="Unassigned">Unassigned</SelectItem>
              {lecturerOptions.map((lecturer, index) => (
                <SelectItem key={lecturer || `lecturer-${index}`} value={lecturer}>{lecturer}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-muted-foreground" />
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {yearOptions.map((year, index) => (
                <SelectItem key={year || `year-${index}`} value={year.toString()}>Year {year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentOptions.map((department, index) => (
                <SelectItem key={department || `department-${index}`} value={department || ''}>{department}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          onClick={() => {
            setSearchTerm("")
            setPerformanceFilter("all")
            setLecturerFilter("all")
            setYearFilter("all")
            setDepartmentFilter("all")
          }}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Clear Filters
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-4">
                <Checkbox
                  checked={paginatedStudents.length>0 && paginatedStudents.every(s=>selectedIds.has(s.id))}
                  onCheckedChange={() => toggleAllCurrentPage(paginatedStudents.map(s=>s.id))}
                />
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("index_number")}
              >
                <div className="flex items-center gap-2">
                  Index #
                  {getSortIcon("index_number")}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("year")}
              >
                <div className="flex items-center gap-2">
                  Year
                  {getSortIcon("year")}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("cwa")}
              >
                <div className="flex items-center gap-2">
                  Current CWA
                  {getSortIcon("cwa")}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("department")}
              >
                <div className="flex items-center gap-2">
                  Department
                  {getSortIcon("department")}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("lecturerName")}
              >
                <div className="flex items-center gap-2">
                  Mentor
                  {getSortIcon("lecturerName")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.length === 0 ? (
              <TableRow key="empty">
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No students match the current filters
                </TableCell>
              </TableRow>
            ) : (
              paginatedStudents.map((student, index) => (
                <TableRow key={student.id || `student-${index}`} className="hover:bg-muted/50">
                  <TableCell className="w-4">
                    <Checkbox
                      checked={selectedIds.has(student.id)}
                      onCheckedChange={() => toggleRow(student.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{student.index_number}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Year {student.year}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{student.cwa ? student.cwa.toFixed(1) : 'N/A'}</span>
                      {student.cwa && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs gap-1 ${getPerformanceBadgeColor(student.cwa)}`}
                        >
                          {getPerformanceIcon(student.cwa)}
                          {getPerformanceLabel(student.cwa)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.department ? (
                      <Badge variant="secondary">{student.department}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className={`h-6 w-6 ${getAvatarColor(student.lecturerName)}`}>
                        <AvatarFallback className="text-white text-xs font-semibold">
                          {getLecturerInitials(student.lecturerName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{student.lecturerName}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <strong>
            {filteredAndSortedStudents.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
            {Math.min(currentPage * rowsPerPage, filteredAndSortedStudents.length)}
          </strong>{" "}
          of <strong>{filteredAndSortedStudents.length}</strong> students
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rows per page:</span>
            <Select 
              value={`${rowsPerPage}`}
              onValueChange={(value) => {
                setRowsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={`${rowsPerPage}`} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Assign Mentor Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Mentor</DialogTitle>
            <DialogDescription>Select a lecturer to assign to the selected students.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedLecturerId} onValueChange={setSelectedLecturerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose lecturer" />
              </SelectTrigger>
              <SelectContent>
                {lecturers.map((l, index) => (
                                          <SelectItem key={l.id || `lecturer-${index}`} value={l.id}>{`${l.firstname} ${l.lastname}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setAssignDialogOpen(false)}>Cancel</Button>
            <Button disabled={!selectedLecturerId} onClick={handleAssignMentor}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}