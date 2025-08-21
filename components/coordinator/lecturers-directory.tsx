"use client"

import { useLecturers, LecturerRow } from "@/hooks/use-lecturers"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  UserPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UploadCloud,
  CheckCircle,
  XCircle,
  Building2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMemo, useState, useEffect } from "react"
import { toast } from "sonner"

type SortField = "name" | "email" | "department" | "status" | "created_at"
type SortDirection = "asc" | "desc"

export default function LecturersDirectory() {
  const { lecturers: dbLecturers, refresh } = useLecturers()
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState<LecturerRow | null>(null)
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    department: "",
    status: "active"
  })

  // Apply filters and sorting
  const filteredAndSortedLecturers = useMemo(() => {
    let filtered = dbLecturers

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lecturer => 
        `${lecturer.firstname} ${lecturer.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lecturer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lecturer.department?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(lecturer => lecturer.status === statusFilter)
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(lecturer => lecturer.department === departmentFilter)
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case "name":
          aValue = `${a.firstname} ${a.lastname}`.toLowerCase()
          bValue = `${b.firstname} ${b.lastname}`.toLowerCase()
          break
        case "email":
          aValue = (a.email || "").toLowerCase()
          bValue = (b.email || "").toLowerCase()
          break
        case "department":
          aValue = (a.department || "").toLowerCase()
          bValue = (b.department || "").toLowerCase()
          break
        case "status":
          aValue = a.status || ""
          bValue = b.status || ""
          break
        case "created_at":
          aValue = new Date(a.created_at || "")
          bValue = new Date(b.created_at || "")
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [dbLecturers, searchTerm, statusFilter, departmentFilter, sortField, sortDirection])

  // Pagination logic
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedLecturers.length / rowsPerPage) || 1
  }, [filteredAndSortedLecturers, rowsPerPage])

  const paginatedLecturers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return filteredAndSortedLecturers.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredAndSortedLecturers, currentPage, rowsPerPage])

  // Get unique options for filters
  const departmentOptions = useMemo(() => {
    const departments = [...new Set(dbLecturers.map(t => t.department).filter(Boolean))] as string[]
    return departments.sort()
  }, [dbLecturers])

  const getStatusBadgeColor = (status: string) => {
    return status === "active" 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getLecturerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", 
      "bg-pink-500", "bg-indigo-500", "bg-red-500", "bg-teal-500"
    ]
    const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
    return colors[hash % colors.length]
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
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
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  const resetForm = () => {
    setFormData({
      firstname: "",
      lastname: "",
      email: "",
      department: "",
      status: "active"
    })
    setEditingLecturer(null)
  }

  const handleSubmit = async () => {
    if (!formData.firstname.trim() || !formData.lastname.trim()) {
      toast.error("First name and last name are required")
      return
    }

    if (!formData.email.trim()) {
      toast.error("Email is required")
      return
    }

    try {
      if (editingLecturer) {
        const response = await fetch('/api/lecturers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingLecturer.id,
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email,
            department: formData.department,
            status: formData.status,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Failed to update lecturer')
          return
        }

        toast.success("Lecturer updated successfully")
        await refresh()
      } else {
        const response = await fetch('/api/lecturers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email,
            department: formData.department,
            status: formData.status,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Failed to add lecturer')
          return
        }

        toast.success("Lecturer added successfully")
        await refresh()
      }

      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error('An error occurred while saving the lecturer')
    }
  }

  const handleEdit = (lecturer: LecturerRow) => {
    setEditingLecturer(lecturer)
    setFormData({
      firstname: lecturer.firstname || "",
      lastname: lecturer.lastname || "",
      email: lecturer.email || "",
      department: lecturer.department || "",
      status: lecturer.status || "active"
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (lecturer: LecturerRow) => {
    if (confirm(`Are you sure you want to delete ${lecturer.firstname} ${lecturer.lastname}?`)) {
      try {
        const response = await fetch(`/api/lecturers?id=${lecturer.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Failed to delete lecturer')
          return
        }

        await refresh()
        toast.success("Lecturer deleted successfully")
      } catch (error) {
        toast.error('An error occurred while deleting the lecturer')
      }
    }
  }



  const stats = useMemo(() => {
    const activeLecturers = dbLecturers.filter(t => t.status === 'active').length
    const totalLecturers = dbLecturers.length
    const departments = new Set(dbLecturers.map(t => t.department).filter(Boolean)).size

    return {
      total: totalLecturers,
      active: activeLecturers,
      inactive: totalLecturers - activeLecturers,
      departments
    }
  }, [dbLecturers])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [filteredAndSortedLecturers, rowsPerPage, currentPage, totalPages])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lecturers Directory</h1>
          <p className="text-gray-600 mt-1">Manage lecturers and mentors</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Lecturer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingLecturer ? 'Edit Lecturer' : 'Add New Lecturer'}</DialogTitle>
                <DialogDescription>
                  {editingLecturer ? 'Update lecturer information.' : 'Add a new lecturer to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firstname"
                    value={formData.firstname}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
                    placeholder="Dr. John"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input
                    id="lastname"
                    value={formData.lastname}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@knust.edu.gh"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                                         <SelectContent>
                       <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                       <SelectItem value="Biomedical Engineering">Biomedical Engineering</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingLecturer ? 'Update' : 'Add'} Lecturer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Lecturers</p>
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
              <p className="text-sm font-medium text-slate-600">Active</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.active}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Inactive</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">{stats.inactive}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Departments</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.departments}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="">
          <div className="flex flex-col sm:flex-row gap-4">
                         <div className="flex-1">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                 <Input
                   placeholder="Search lecturers..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10"
                 />
               </div>
             </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
                             <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                 <SelectTrigger className="w-64 !w-64">
                   <SelectValue placeholder="All Departments" />
                 </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentOptions.map(department => (
                    <SelectItem key={department} value={department}>{department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setDepartmentFilter("all")
                }}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lecturers Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Lecturer
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center gap-2">
                  Email
                  {getSortIcon("email")}
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
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  Status
                  {getSortIcon("status")}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center gap-2">
                  Created
                  {getSortIcon("created_at")}
                </div>
              </TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLecturers.map((lecturer, index) => (
              <TableRow key={lecturer.id} className="hover:bg-muted/50">
                <TableCell className="text-gray-500">
                  {(currentPage - 1) * rowsPerPage + index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className={`w-8 h-8 ${getAvatarColor(`${lecturer.firstname} ${lecturer.lastname}`)}`}>
                      <AvatarFallback className="text-xs font-medium text-black">
                        {getLecturerInitials(`${lecturer.firstname} ${lecturer.lastname}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">{`${lecturer.firstname} ${lecturer.lastname}`}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{lecturer.email || '-'}</TableCell>
                <TableCell className="text-gray-600">{lecturer.department || '-'}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusBadgeColor(lecturer.status || 'inactive')} text-xs font-medium`}>
                    {lecturer.status || 'inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">{formatDate(lecturer.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(lecturer)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(lecturer)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <strong>
            {filteredAndSortedLecturers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
            {Math.min(currentPage * rowsPerPage, filteredAndSortedLecturers.length)}
          </strong>{" "}
          of <strong>{filteredAndSortedLecturers.length}</strong> lecturers
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rows per page:</span>
            <Select 
              value={rowsPerPage.toString()} 
              onValueChange={(value) => {
                setRowsPerPage(parseInt(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={rowsPerPage.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>{pageSize}</SelectItem>
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
    </div>
  )
} 