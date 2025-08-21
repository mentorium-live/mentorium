"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePairingStore } from "@/hooks/use-pairing-store"
import type { UploadEntry } from "@/hooks/use-pairing-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconTrendingUp, IconAlertTriangle, IconTrendingDown, IconUsers, IconSchool } from "@tabler/icons-react"

export default function CoordinatorDashboardOverview() {
  // Pull data from store (mock for now)
  const { students, lecturers, pairings, uploads } = usePairingStore()

  const stats = useMemo(() => {
    const totalStudents = students.length
    const totalLecturers = lecturers.length
    const pairedStudentIds = new Set(pairings.map(p => p.student.index_number))
    const pairedStudents = pairedStudentIds.size
    const unpairedStudents = totalStudents - pairedStudents
    const pairedPercent = totalStudents > 0 ? ((pairedStudents / totalStudents) * 100).toFixed(1) : "0"
    return {
      totalStudents,
      totalLecturers,
      pairedStudents,
      pairedPercent,
      unpairedStudents,
    }
  }, [students, lecturers, pairings])

  // Placeholder uploads (until real persistence added)
  const recentUploads: UploadEntry[] = [...uploads].slice(-5).reverse()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of key department metrics and recent activity
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Students</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalStudents}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <IconUsers className="h-6 w-6 text-slate-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Lecturers</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalLecturers}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <IconSchool className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Students Paired</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.pairedStudents}</p>
              <p className="text-xs text-slate-500 mt-1">{stats.pairedPercent}% paired</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <IconUsers className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Unpaired Students</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">{stats.unpairedStudents}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
              {stats.unpairedStudents > 0 ? (
                <IconAlertTriangle className="h-6 w-6 text-amber-600" />
              ) : (
                <IconTrendingUp className="h-6 w-6 text-emerald-600" />
              )}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/coordinator/upload" className="gap-2">
            Upload Results
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/coordinator/students" className="gap-2">
            View Student Directory
          </Link>
        </Button>
      </div>

      {/* Recent Uploads */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Recent Uploads</h2>
        {recentUploads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No uploads yet.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUploads.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/50">
                    <TableCell>{new Date(u.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{u.fileName}</TableCell>
                    <TableCell className="text-right tabular-nums">{u.rows}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === "failed" ? "destructive" : u.paired ? "secondary" : "outline"}>
                        {u.status === "failed" ? "Failed" : u.paired ? "Paired" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
} 