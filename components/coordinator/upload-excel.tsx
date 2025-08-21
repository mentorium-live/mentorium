"use client"

import { useState, useMemo, useEffect } from "react"
import { performBidirectionalPairing } from "@/lib/perform-pairing"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileText, Calendar, GraduationCap, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ParsedData {
  headers: string[]
  rows: any[][]
}

// Map internal Excel column keys to friendly display labels
const headerDisplay: Record<string, string> = {
  studentid: "Student ID",
  indexno: "Index Number",
  name: "Name",
  cwa: "CWA",
  index_number: "Index Number",
  student_name: "Student Name",
  first_name: "First Name",
  middle_name: "Middle Name",
  last_name: "Last Name",
}

function formatHeader(key: string): string {
  return (
    headerDisplay[key.toLowerCase()] ||
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
  )
}

// Function to parse the name format: "LASTNAME, Firstname MiddleName (Miss)"
function parseName(fullName: string): { firstName: string; lastName: string; middleName: string; isMiss: boolean } {
  // Remove (Miss) if present and track if it was there
  const isMiss = fullName.includes("(Miss)")
  const nameWithoutMiss = fullName.replace(/\s*\(Miss\)\s*/, "").trim()
  
  // Split by comma to separate last name from first/middle names
  const parts = nameWithoutMiss.split(",")
  
  if (parts.length >= 2) {
    const lastName = parts[0].trim()
    const firstMiddleNames = parts[1].trim()
    
    // Split first/middle names by space
    const nameParts = firstMiddleNames.split(" ")
    const firstName = nameParts[0] || ""
    const middleName = nameParts.slice(1).join(" ") || ""
    
    return {
      firstName: firstName,
      lastName: lastName,
      middleName: middleName,
      isMiss: isMiss
    }
  } else {
    // Fallback if no comma found
    const nameParts = nameWithoutMiss.split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""
    
    return {
      firstName: firstName,
      lastName: lastName,
      middleName: "",
      isMiss: isMiss
    }
  }
}

export default function UploadExcel() {
  const [data, setData] = useState<ParsedData | null>(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isDragOver, setIsDragOver] = useState(false)

  // Parsed rows waiting to be saved
  const [pendingRows, setPendingRows] = useState<any[]>([])
  const [pairingsPreview, setPairingsPreview] = useState<{ student: any; lecturer: any }[] | null>(null)
  const [previewMode, setPreviewMode] = useState<'list'|'cards'>('cards')
  const [isPairingLoading, setIsPairingLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [existingPairings, setExistingPairings] = useState<{[key: string]: string}>({})

  // Upload configuration
  const [uploadConfig, setUploadConfig] = useState({
    yearGroup: "1",
    semester: "1",
    department: "Computer Engineering"
  })

  const checkExistingPairings = async (indexNumbers: string[]) => {
    try {
      if (!indexNumbers.length) return {}
      const res = await fetch('/api/students/check-pairings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index_numbers: indexNumbers })
      })
      if (!res.ok) return {}
      const json = await res.json()
      return json as Record<string, string>
    } catch (error) {
      console.warn('Error checking existing pairings:', error)
      return {}
    }
  }

  const handleFile = async (file: File) => {
    // Check if file is Excel
    const isExcel = file.type.includes("spreadsheet") || 
                   file.type.includes("excel") || 
                   file.name.endsWith('.xlsx') || 
                   file.name.endsWith('.xls')
    
    if (!isExcel) {
      toast.error("Please upload an Excel file (.xlsx or .xls)")
      return
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (jsonData.length < 2) {
        toast.error("Excel file must have at least a header row and one data row")
        return
      }

      const headers = jsonData[0] as string[]
      const rows = jsonData.slice(1) as any[][]

      // Convert rows to objects for easier processing
      const rowObjects = rows.map(row => {
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = row[index]
        })
        return obj
      })

      const parsedRows = rowObjects.map((row: any) => {
        // Handle different column name variations
        const studentId = row.STUDENTID || row.studentid || row.student_id || ""
        const indexNo = row.INDEXNO || row.indexno || row.index_number || ""
        const fullName = row.NAME || row.name || row.student_name || ""
        const cwa = row.CWA || row.cwa || 0

        // Parse the name format
        const parsedName = parseName(fullName)
        const displayName = `${parsedName.firstName} ${parsedName.middleName} ${parsedName.lastName}`.trim()

        return {
          studentid: studentId,
          index_number: indexNo,
          name: displayName,
          original_name: fullName, // Keep original for reference
          cwa: parseFloat(cwa) || 0,
          year_of_admission: parseInt(uploadConfig.yearGroup),
          semester: parseInt(uploadConfig.semester),
          department: uploadConfig.department, // Add department from upload config
        }
      })

      setPendingRows(parsedRows)
              toast.success(`Excel file parsed for Year ${uploadConfig.yearGroup}, Semester ${uploadConfig.semester}, ${uploadConfig.department} – click 'Run Pairing' to preview`)

      setData({ headers, rows })

      // Check for existing pairings
      const indexNumbers = parsedRows.map(row => row.index_number)
      const existing = await checkExistingPairings(indexNumbers)
      setExistingPairings(existing)
      
      const alreadyPairedCount = Object.keys(existing).length
      if (alreadyPairedCount > 0) {
        toast.warning(`⚠️ ${alreadyPairedCount} students are already paired with lecturers`)
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error)
      toast.error("Failed to parse Excel file")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const fileInputProps = {
    type: "file",
    accept: ".xlsx,.xls",
    className: "hidden",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file as unknown as File)
    },
  }

  const stats = useMemo(() => {
    if (!data) return null
    
    // Extract CWA values from the uploaded data
    const cwaValues = data.rows
      .map((row: any) => {
        // Find the CWA column index
        const cwaIndex = data.headers.findIndex((header: string) => 
          header.toLowerCase() === 'cwa'
        )
        if (cwaIndex === -1) return null
        
        const cwaValue = row[cwaIndex]
        const parsedValue = parseFloat(cwaValue)
        return isNaN(parsedValue) ? null : parsedValue
      })
      .filter((v): v is number => v !== null && !Number.isNaN(v))

    if (cwaValues.length === 0) return null

    const total = cwaValues.reduce((acc, v) => acc + v, 0)
    return {
      count: cwaValues.length,
      avg: (total / cwaValues.length).toFixed(2),
      min: Math.min(...cwaValues).toFixed(2),
      max: Math.max(...cwaValues).toFixed(2),
    }
  }, [data])

  // Determine the Index Number column position from uploaded headers
  const indexColumnIndex = useMemo(() => {
    if (!data) return -1
    const normalized = data.headers.map((h: any) => String(h || '').toLowerCase().trim())
    const candidates = [
      'indexno',
      'index_number',
      'index number',
      'index',
    ]
    for (const key of candidates) {
      const idx = normalized.findIndex((h: string) => h === key)
      if (idx !== -1) return idx
    }
    return -1
  }, [data])

  const paginatedRows = useMemo(() => {
    if (!data) return []
    const startIndex = (page - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return data.rows.slice(startIndex, endIndex)
  }, [data, page, rowsPerPage])

  const totalPages = useMemo(() => {
    if (!data) return 1
    return Math.ceil(data.rows.length / rowsPerPage)
  }, [data, rowsPerPage])

  useEffect(() => {
    if (data && page > totalPages) {
      setPage(1)
    }
  }, [data, totalPages, page])

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Upload Configuration and Area - Only show when no data */}
      {!data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upload Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year-group">Year Group</Label>
                  <Select 
                    value={uploadConfig.yearGroup} 
                    onValueChange={(value) => setUploadConfig(prev => ({ ...prev, yearGroup: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select 
                    value={uploadConfig.semester} 
                    onValueChange={(value) => setUploadConfig(prev => ({ ...prev, semester: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={uploadConfig.department} 
                    onValueChange={(value) => setUploadConfig(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                      <SelectItem value="Biomedical Engineering">Biomedical Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5" />
                Upload Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <label 
                  className={`flex flex-col items-center justify-center border border-dashed border-input rounded-lg p-8 cursor-pointer transition-colors ${
                    isDragOver 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud className={`size-8 transition-colors ${
                    isDragOver ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className="mt-2 text-sm">
                    {isDragOver ? 'Drop Excel file here' : 'Drag & drop or click to upload Excel file'}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Year {uploadConfig.yearGroup}, Semester {uploadConfig.semester}, {uploadConfig.department}
                  </span>
                  <input {...fileInputProps} />
                </label>
                
                <div className="text-center">
                  <a
                    href="/templates/results_upload_template.xlsx"
                    download
                    className="text-primary underline text-sm cursor-pointer hover:text-blue-800"
                  >
                    Download Excel template
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

             {/* Stats and Pairing Button */}
       {data && (
         <Card>
                       <CardHeader>
             <div className="flex items-center justify-between">
               <CardTitle className="flex items-center gap-2">
                 <FileText className="h-5 w-5" />
                 Upload Summary & Analytics
               </CardTitle>
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={() => {
                   setData(null)
                   setPendingRows([])
                   setPairingsPreview(null)
                 }}
               >
                 Upload New File
               </Button>
             </div>
           </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-lg font-semibold">{stats?.count}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Average CWA</p>
                  <p className="text-lg font-semibold">{stats?.avg}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Highest CWA</p>
                  <p className="text-lg font-semibold">{stats?.max}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Lowest CWA</p>
                  <p className="text-lg font-semibold">{stats?.min}</p>
                </div>
              </div>

              {/* Detailed Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Distribution */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Performance Distribution</h3>
                  <div className="space-y-3">
                                          {(() => {
                        // Extract CWA values from the uploaded data
                        const cwaIndex = data.headers.findIndex((header: string) => 
                          header.toLowerCase() === 'cwa'
                        )
                        const cwaValues = data.rows
                          .map((row: any) => {
                            if (cwaIndex === -1) return null
                            const cwaValue = row[cwaIndex]
                            const parsedValue = parseFloat(cwaValue)
                            return isNaN(parsedValue) ? null : parsedValue
                          })
                          .filter((v): v is number => v !== null && !Number.isNaN(v))
                        
                        const excellent = cwaValues.filter(cwa => cwa >= 70 && cwa <= 100).length
                        const good = cwaValues.filter(cwa => cwa >= 60 && cwa < 70).length
                        const fair = cwaValues.filter(cwa => cwa >= 50 && cwa < 60).length
                        const needsImprovement = cwaValues.filter(cwa => cwa < 50).length
                        
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Excellent (70-100)</span>
                              <Badge variant="secondary">{excellent} students</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Good (60-69)</span>
                              <Badge variant="outline">{good} students</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Fair (50-59)</span>
                              <Badge variant="outline">{fair} students</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Needs Improvement (&lt;50)</span>
                              <Badge variant="destructive">{needsImprovement} students</Badge>
                            </div>
                          </>
                        )
                      })()}
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Quick Insights</h3>
                  <div className="space-y-3 text-sm">
                                          {(() => {
                        // Extract CWA values from the uploaded data
                        const cwaIndex = data.headers.findIndex((header: string) => 
                          header.toLowerCase() === 'cwa'
                        )
                        const cwaValues = data.rows
                          .map((row: any) => {
                            if (cwaIndex === -1) return null
                            const cwaValue = row[cwaIndex]
                            const parsedValue = parseFloat(cwaValue)
                            return isNaN(parsedValue) ? null : parsedValue
                          })
                          .filter((v): v is number => v !== null && !Number.isNaN(v))
                        
                        const total = cwaValues.length
                        const excellent = cwaValues.filter(cwa => cwa >= 70 && cwa <= 100).length
                        const needsImprovement = cwaValues.filter(cwa => cwa < 50).length
                        const excellentPercentage = total > 0 ? ((excellent / total) * 100).toFixed(1) : 0
                        const needsImprovementPercentage = total > 0 ? ((needsImprovement / total) * 100).toFixed(1) : 0
                        
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>{excellentPercentage}% of students have excellent performance (CWA ≥ 70)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span>Average CWA: {stats?.avg} (Class average)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>{needsImprovementPercentage}% of students need academic support (CWA &lt; 50)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Year {uploadConfig.yearGroup}, Semester {uploadConfig.semester}, {uploadConfig.department} results uploaded</span>
                            </div>
                          </>
                        )
                      })()}
                  </div>
                </div>
              </div>

                              {/* Action Buttons */}
               <div className="flex justify-end">
                 {uploadConfig.yearGroup === '1' && uploadConfig.semester === '1' ? (
                   <Button 
                     disabled={!pendingRows.length || isPairingLoading} 
                     onClick={async() => {
                       if(!pendingRows.length) return
                       console.log('Starting pairing process...', { uploadConfig, pendingRowsCount: pendingRows.length })
                       setIsPairingLoading(true)
                       await new Promise((res) => setTimeout(res, 2000))
                       
                       try {
                         // For Year 1, Sem 1: Use department-based pairing
                         if (uploadConfig.yearGroup === '1' && uploadConfig.semester === '1') {
                           console.log('Fetching lecturers for department:', uploadConfig.department)
                           
                           const response = await fetch(`/api/lecturers?department=${encodeURIComponent(uploadConfig.department)}&status=active`)
                           
                           if (!response.ok) {
                             console.error('API error:', response.status, response.statusText)
                             toast.error('Failed to fetch lecturers from database');
                             setIsPairingLoading(false);
                             return;
                           }
                           
                           const lecturers = await response.json()
                           console.log('Lecturers API result:', lecturers)
                           
                           if (!Array.isArray(lecturers)) {
                             console.error('Invalid response format:', lecturers)
                             toast.error('Invalid response from lecturers API');
                             setIsPairingLoading(false);
                             return;
                           }
                           
                           if (lecturers.length === 0) {
                             console.warn('No lecturers found for department:', uploadConfig.department)
                             toast.error(`No active lecturers found for ${uploadConfig.department} department. Please add lecturers first.`);
                             setIsPairingLoading(false);
                             return;
                           }
                        
                        const studentObjs = pendingRows.map((r) => ({ 
                          index_number: r.index_number,
                          firstname: r.name.split(' ')[0] || '',
                          lastname: r.name.split(' ').slice(1).join(' ') || '',
                          name: r.name,
                          cwa: r.cwa,
                          year: parseInt(uploadConfig.yearGroup) 
                        }))
                        const lecturerObjs = lecturers.map((l, index) => ({ 
                          id: index + 1, // Convert UUID to sequential number for pairing algorithm
                          uuid: l.id, // Keep original UUID for database operations
                          firstname: l.firstname,
                          lastname: l.lastname,
                          department: l.department
                        }))
                        
                        console.log('Calling performBidirectionalPairing with:', { studentObjs, lecturerObjs })
                        // 1) Save students first
                        try {
                          const saveRes = await fetch('/api/students/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ rows: pendingRows }),
                          })
                          if (!saveRes.ok) {
                            const { error } = await saveRes.json()
                            toast.error(error || 'Failed to save students')
                            setIsPairingLoading(false)
                            return
                          }
                        } catch (e) {
                          toast.error('Failed to save students')
                          setIsPairingLoading(false)
                          return
                        }

                        const pairs = performBidirectionalPairing(studentObjs as any, lecturerObjs as any)
                        console.log('Pairing result:', pairs)

                        setPairingsPreview(pairs)
                        setPreviewMode('cards')
                        setIsPairingLoading(false)
                        toast.success(`Generated ${pairs.length} student-lecturer pairings for ${uploadConfig.department} department`)
                       } else {
                         // For other semesters: Use all active lecturers
                         console.log('Fetching all active lecturers for other semesters')
                         
                         const response = await fetch('/api/lecturers?status=active')
                         
                         if (!response.ok) {
                           console.error('API error:', response.status, response.statusText)
                           toast.error('Failed to fetch lecturers from database');
                           setIsPairingLoading(false);
                           return;
                         }
                         
                         const lecturers = await response.json()
                         console.log('All lecturers API result:', lecturers)
                         
                         if (!Array.isArray(lecturers) || lecturers.length === 0) {
                           toast.error('No active lecturers found. Please add lecturers first.');
                           setIsPairingLoading(false);
                           return;
                         }
                         
                        const studentObjs = pendingRows.map((r) => ({ 
                          index_number: r.index_number,
                          firstname: r.name.split(' ')[0] || '',
                          lastname: r.name.split(' ').slice(1).join(' ') || '',
                          name: r.name,
                          cwa: r.cwa,
                          year: parseInt(uploadConfig.yearGroup) 
                        }))
                        const lecturerObjs = lecturers.map((l, index) => ({ 
                          id: index + 1, // Convert UUID to sequential number for pairing algorithm
                          uuid: l.id, // Keep original UUID for database operations
                          firstname: l.firstname,
                          lastname: l.lastname,
                          department: l.department
                        }))
                         const pairs = performBidirectionalPairing(studentObjs as any, lecturerObjs as any)
                         setPairingsPreview(pairs)
                         setPreviewMode('cards')
                         setIsPairingLoading(false)
                         toast.success(`Generated ${pairs.length} student-lecturer pairings`)
                       }
                       } catch (error) {
                         console.error('Error during pairing process:', error)
                         toast.error('Failed to generate pairings. Please try again.')
                         setIsPairingLoading(false)
                       }
                     }}
                   >
                     {isPairingLoading ? 'Pairing...' : 'Run Pairing'}
                   </Button>
                 ) : (
                   <Button 
                     disabled={!pendingRows.length || isSaving} 
                     onClick={async() => {
                       if(!pendingRows.length) return
                       setIsSaving(true)
                       toast.info('Uploading students and creating pairings...')
                       try {
                                               const res = await fetch('/api/pair-and-store',{
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body: JSON.stringify({ rows: pendingRows }),
                      })
                      if(!res.ok){ 
                        const {error}=await res.json(); 
                        toast.error(error||'Save failed'); 
                        setIsSaving(false);
                        return; 
                      }
                      const {inserted, pairings, message}=await res.json();
                      setPendingRows([])
                      setData(null)
                      
                                             // Show a success message with more details
                       toast.success(`✅ Upload complete! ${inserted} students updated for ${uploadConfig.department}. Redirecting to students directory...`)
                       
                       // Wait a bit longer to ensure database operations complete
                       setTimeout(() => {
                         window.location.href = '/coordinator/students?refresh=true'
                       }, 3000)
                       } catch (error) {
                         console.error('Upload error:', error)
                         toast.error('Failed to update results. Please try again.')
                       } finally {
                         setIsSaving(false)
                       }
                     }}
                   >
                     {isSaving ? 'Uploading...' : 'Upload Results'}
                   </Button>
                 )}
               </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pairing Preview */}
      {pairingsPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Pairing Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                              <Badge variant="secondary">
              Year {uploadConfig.yearGroup}, Semester {uploadConfig.semester}
            </Badge>
                  <Badge variant="outline">
                    {pairingsPreview.length} pairings
                  </Badge>
                </div>
                <Button 
                  onClick={async() => {
                    setIsSaving(true)
                    try {
                      // 1) Ensure students are saved
                      const saveStudents = await fetch('/api/students/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rows: pendingRows }),
                      })
                      if (!saveStudents.ok) {
                        const { error } = await saveStudents.json()
                        toast.error(error || 'Failed to save students')
                        setIsSaving(false)
                        return
                      }

                      // 2) Save pairings based on preview
                      if (!pairingsPreview || pairingsPreview.length === 0) {
                        toast.error('No pairings to save')
                        setIsSaving(false)
                        return
                      }

                      // Map preview to payload
                      const pairingPayload = pairingsPreview.map(p => ({
                        student_index_number: p.student.index_number,
                        lecturer_id: p.lecturer.uuid,
                      }))

                      const savePairs = await fetch('/api/pairings/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pairings: pairingPayload })
                      })
                      if (!savePairs.ok) {
                        const { error } = await savePairs.json()
                        toast.error(error || 'Failed to save pairings')
                        setIsSaving(false)
                        return
                      }

                      const { saved } = await savePairs.json()

                      setPendingRows([])
                      setPairingsPreview(null)
                      setData(null)
                      toast.success(`✅ Saved students and ${saved} pairings. Redirecting...`)
                      setTimeout(() => {
                        window.location.href = '/coordinator/students?refresh=true'
                      }, 2000)
                    } catch (error) {
                      console.error('Save error:', error)
                      toast.error('Failed to save to database. Please try again.')
                    } finally {
                      setIsSaving(false)
                    }
                  }} 
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save to Database'}
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(pairingsPreview.reduce((acc:any, p)=>{
                  const lecturerName = `${p.lecturer.firstname} ${p.lecturer.lastname}`;
                  (acc[lecturerName]=acc[lecturerName]||[]).push(p.student);return acc;},{})).map(([lec, studs]:any)=> (
                  <Card key={lec}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4"/>
                        {lec}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {studs.map((s:any)=> (
                        <div key={s.index_number} className="flex items-center justify-between text-sm">
                          <span>{s.name}</span>
                          <Badge variant="outline">{s.cwa}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                  <TableRow>
                    {data.headers.map((h) => (
                      <TableHead key={h}>{formatHeader(h)}</TableHead>
                    ))}
                    <TableHead>Pairing Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((row, idx) => {
                    const indexNumber = indexColumnIndex !== -1 ? String((row as any)[indexColumnIndex] ?? '').trim() : ''
                    const lecturerName = existingPairings[indexNumber]
                    const isPaired = !!lecturerName
                    
                    return (
                      <TableRow key={idx} className={isPaired ? "bg-yellow-50" : ""}>
                        {Object.values(row).map((cell, idx2) => (
                          <TableCell key={idx2}>{cell}</TableCell>
                        ))}
                        <TableCell>
                          {isPaired ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Paired with {lecturerName}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Paired</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Select
                  value={String(rowsPerPage)}
                  onValueChange={(value) => {
                    setRowsPerPage(Number(value))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder={rowsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  Rows per page
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 