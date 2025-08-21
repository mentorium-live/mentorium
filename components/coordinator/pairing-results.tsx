
"use client"

import { usePairingStore, Student } from "@/hooks/use-pairing-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
  GraduationCap, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Star,
  Target,
  Grid3X3,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download
} from "lucide-react"
import { useMemo, useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type SortField = "name" | "index_number" | "cwa" | "lecturerName"
type SortDirection = "asc" | "desc"

export function PairingResults() {
  const { pairings } = usePairingStore()
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [sortField, setSortField] = useState<SortField>("cwa")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [performanceFilter, setPerformanceFilter] = useState<string>("all")
  const [lecturerFilter, setLecturerFilter] = useState<string>("all")

  const pairingsByLecturer = useMemo(() => {
    return pairings.reduce((acc, pairing) => {
      const { lecturer, student } = pairing
      const lecturerName = `${lecturer.firstname} ${lecturer.lastname}`
      if (!acc[lecturerName]) {
        acc[lecturerName] = {
          lecturer,
          students: [],
          avgCwa: 0,
          highestCwa: 0,
          lowestCwa: 0
        }
      }
      acc[lecturerName].students.push(student)
      
      // Calculate statistics
      const students = acc[lecturerName].students
      const cwas = students.map((s: Student) => s.cwa)
      acc[lecturerName].avgCwa = cwas.reduce((sum: number, cwa: number) => sum + cwa, 0) / cwas.length
      acc[lecturerName].highestCwa = Math.max(...cwas)
      acc[lecturerName].lowestCwa = Math.min(...cwas)
      
      return acc
    }, {} as Record<string, any>)
  }, [pairings])

  const allPairingsFlat = useMemo(() => {
    let filtered = pairings.map(pairing => ({
      ...pairing.student,
      name: `${pairing.student.firstname} ${pairing.student.lastname}`, // Generate full name
      lecturerName: `${pairing.lecturer.firstname} ${pairing.lecturer.lastname}`
    })) as (Student & { name: string; lecturerName: string })[]

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

    // Apply lecturer filter
    if (lecturerFilter !== "all") {
      filtered = filtered.filter(student => student.lecturerName === lecturerFilter)
    }

    // Apply sorting
    return filtered.sort((a, b) => {
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
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [pairings, searchTerm, performanceFilter, lecturerFilter, sortField, sortDirection])

  const lecturerOptions = useMemo(() => {
    return Object.keys(pairingsByLecturer).sort()
  }, [pairingsByLecturer])

  const getPerformanceBadgeColor = (cwa: number) => {
    if (cwa >= 70) return "bg-green-100 text-green-800 border-green-200"
    if (cwa >= 60) return "bg-blue-100 text-blue-800 border-blue-200"  
    if (cwa >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getPerformanceIcon = (cwa: number) => {
    if (cwa >= 70) return <TrendingUp className="w-3 h-3" />
    if (cwa >= 60) return <Minus className="w-3 h-3" />
    return <TrendingDown className="w-3 h-3" />
  }

  const getPerformanceLabel = (cwa: number) => {
    if (cwa >= 70) return 'Excellent'
    if (cwa >= 60) return 'Good'
    if (cwa >= 50) return 'Fair'
    return 'Needs Attention'
  }

  const getLecturerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500"
    ]
    return colors[index % colors.length]
  }

  const exportPairingsToCSV = () => {
    const headers = ["Student Name", "Index Number", "CWA", "Assigned Lecturer"]
    const csvData = pairings.map(pairing => [
      `${pairing.student.firstname} ${pairing.student.lastname}`,
      pairing.student.index_number,
      pairing.student.cwa.toFixed(2),
      `${pairing.lecturer.firstname} ${pairing.lecturer.lastname}`
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `student_lecturer_pairings_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  if (pairings.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">No Pairings Yet</h3>
        <p className="text-sm text-muted-foreground">Upload student data and run pairing to see results</p>
      </div>
    )
  }

  const CardView = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(pairingsByLecturer).map(([lecturerName, data], index) => (
        <Card key={lecturerName} className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Avatar className={`h-12 w-12 ${getAvatarColor(index)}`}>
                <AvatarFallback className="text-white font-semibold">
                  {getLecturerInitials(lecturerName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg leading-none">{lecturerName}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Users className="w-3 h-3" />
                    {data.students.length} mentees
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Performance Overview */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Avg CWA</div>
                <div className="font-semibold text-sm">{data.avgCwa.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" />
                  Highest
                </div>
                <div className="font-semibold text-sm">{data.highestCwa.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Target className="w-3 h-3" />
                  Lowest
                </div>
                <div className="font-semibold text-sm">{data.lowestCwa.toFixed(1)}</div>
              </div>
            </div>

            {/* Student List */}
            <TooltipProvider>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Assigned Students
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.students
                    .sort((a: Student, b: Student) => b.cwa - a.cwa) // Sort by CWA descending
                    .map((student: Student, studentIndex: number) => (
                    <div 
                      key={student.index_number} 
                      className="flex items-center justify-between p-2 rounded-md bg-background border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="font-medium text-sm truncate">{`${student.firstname} ${student.lastname}`}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{`${student.firstname} ${student.lastname}`}</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="text-xs text-muted-foreground">{student.index_number}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs gap-1 ${getPerformanceBadgeColor(student.cwa)}`}
                        >
                          {getPerformanceIcon(student.cwa)}
                          {student.cwa.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const ListView = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
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
              <SelectValue placeholder="Filter by lecturer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lecturers</SelectItem>
              {lecturerOptions.map(lecturer => (
                <SelectItem key={lecturer} value={lecturer}>{lecturer}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(searchTerm || performanceFilter !== "all" || lecturerFilter !== "all") && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSearchTerm("")
              setPerformanceFilter("all")
              setLecturerFilter("all")
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {allPairingsFlat.length} of {pairings.length} students
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Student Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("index_number")}
              >
                <div className="flex items-center gap-2">
                  Index Number
                  {getSortIcon("index_number")}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("cwa")}
              >
                <div className="flex items-center gap-2">
                  CWA
                  {getSortIcon("cwa")}
                </div>
              </TableHead>
              <TableHead className="font-semibold">Performance</TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("lecturerName")}
              >
                <div className="flex items-center gap-2">
                  Assigned Lecturer
                  {getSortIcon("lecturerName")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPairingsFlat.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No students match the current filters
                </TableCell>
              </TableRow>
            ) : (
              allPairingsFlat.map((student, index) => (
                <TableRow key={student.index_number} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="font-mono text-sm">{student.index_number}</TableCell>
                  <TableCell className="font-semibold">{student.cwa.toFixed(1)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`text-xs gap-1 ${getPerformanceBadgeColor(student.cwa)}`}
                    >
                      {getPerformanceIcon(student.cwa)}
                      {getPerformanceLabel(student.cwa)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className={`h-6 w-6 ${getAvatarColor(Object.keys(pairingsByLecturer).indexOf(student.lecturerName))}`}>
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
    </div>
  )

  return (
    <div className="w-full space-y-6">
      {/* Header with Overall Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pairing Results</h2>
          <p className="text-muted-foreground">
            {pairings.length} students paired with {Object.keys(pairingsByLecturer).length} lecturers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Users className="w-3 h-3" />
            {pairings.length} Total Students
          </Badge>
          
          {/* Export Button */}
          <Button onClick={exportPairingsToCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Pairings CSV
          </Button>
          
          {/* View Toggle */}
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "cards" | "list")}>
            <ToggleGroupItem value="cards" aria-label="Card view" className="gap-2">
              <Grid3X3 className="w-4 h-4" />
              Cards
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" className="gap-2">
              <List className="w-4 h-4" />
              List
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Dynamic Content Based on View Mode */}
      {viewMode === "cards" ? <CardView /> : <ListView />}

      {/* Summary Footer */}
      <div className="mt-8 p-4 bg-muted/20 rounded-lg border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Pairing completed using <strong>Bidirectional Round-Robin</strong> algorithm
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Students distributed evenly across lecturers with alternating assignment directions
          </p>
        </div>
      </div>
    </div>
  )
}
