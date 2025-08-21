"use client"

import { useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  TrendingUp, 
  GraduationCap,
  BarChart3,
  PieChart,
  AlertTriangle,
} from "lucide-react"
import { useStudents } from "@/hooks/use-students"
import { useLecturers } from "@/hooks/use-lecturers"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

type DepartmentSummary = {
  department: string
  studentCount: number
  pairedCount: number
  avgCwa: number | null
  lecturerCount: number
  minCwa: number | null
  maxCwa: number | null
}

export default function CoordinatorAnalyticsPage() {
  const { students, isLoading: studentsLoading } = useStudents()
  const { lecturers, isLoading: lecturersLoading } = useLecturers()

  const {
    totalStudents,
    totalLecturers,
    pairedStudents,
    unpairedStudents,
    avgCwaOverall,
    menteesPerLecturerTop,
    departmentSummaries,
  } = useMemo(() => {
    const totalStudents = students.length
    const totalLecturers = lecturers.length
    const pairedStudents = students.filter((s) => !!s.lecturer_id).length
    const unpairedStudents = totalStudents - pairedStudents

    // Overall average CWA
    const cwas = students.map((s) => s.current_cwa).filter((n): n is number => typeof n === "number")
    const avgCwaOverall = cwas.length ? cwas.reduce((a, b) => a + b, 0) / cwas.length : null

    // Mentees per lecturer
    const menteeCountByLecturerId = new Map<string, number>()
    const lecturerNameById = new Map<string, string>()
    lecturers.forEach((l) => {
      lecturerNameById.set(l.id, `${l.firstname} ${l.lastname}`)
    })
    for (const s of students) {
      if (s.lecturer_id) {
        menteeCountByLecturerId.set(
          s.lecturer_id,
          (menteeCountByLecturerId.get(s.lecturer_id) ?? 0) + 1
        )
      }
    }
    const menteesPerLecturer = Array.from(menteeCountByLecturerId.entries()).map(
      ([lecturerId, count]) => ({
        lecturer: lecturerNameById.get(lecturerId) ?? "Unknown",
        mentees: count,
      })
    )
    const menteesPerLecturerTop = menteesPerLecturer
      .sort((a, b) => b.mentees - a.mentees)
      .slice(0, 7)

    // Department summaries
    const studentsByDept = new Map<string, { total: number; paired: number; cwaSum: number; cwaCount: number; cwaMin: number; cwaMax: number }>()
    for (const s of students) {
      const dept = s.department ?? "Unassigned"
      if (!studentsByDept.has(dept)) {
        studentsByDept.set(dept, { total: 0, paired: 0, cwaSum: 0, cwaCount: 0, cwaMin: Number.POSITIVE_INFINITY, cwaMax: Number.NEGATIVE_INFINITY })
      }
      const agg = studentsByDept.get(dept)!
      agg.total += 1
      if (s.lecturer_id) agg.paired += 1
      if (typeof s.current_cwa === "number") {
        agg.cwaSum += s.current_cwa
        agg.cwaCount += 1
        if (s.current_cwa < agg.cwaMin) agg.cwaMin = s.current_cwa
        if (s.current_cwa > agg.cwaMax) agg.cwaMax = s.current_cwa
      }
    }
    const lecturersByDept = new Map<string, number>()
    for (const l of lecturers) {
      const dept = l.department ?? "Unassigned"
      lecturersByDept.set(dept, (lecturersByDept.get(dept) ?? 0) + 1)
    }
    const departmentSummaries: DepartmentSummary[] = Array.from(studentsByDept.entries()).map(
      ([dept, agg]) => ({
        department: dept,
        studentCount: agg.total,
        pairedCount: agg.paired,
        avgCwa: agg.cwaCount ? agg.cwaSum / agg.cwaCount : null,
        lecturerCount: lecturersByDept.get(dept) ?? 0,
        minCwa: agg.cwaCount ? agg.cwaMin : null,
        maxCwa: agg.cwaCount ? agg.cwaMax : null,
      })
    )

    return {
      totalStudents,
      totalLecturers,
      pairedStudents,
      unpairedStudents,
      avgCwaOverall,
      menteesPerLecturerTop,
      departmentSummaries,
    }
  }, [students, lecturers])

  const pairedVsUnpairedData = useMemo(
    () => [
      { name: "Paired", value: pairedStudents },
      { name: "Unpaired", value: unpairedStudents },
    ],
    [pairedStudents, unpairedStudents]
  )

  const departmentStudentsBarData = useMemo(
    () =>
      departmentSummaries
        .slice()
        .sort((a, b) => b.studentCount - a.studentCount)
        .slice(0, 7)
        .map((d) => ({ department: d.department, students: d.studentCount, paired: d.pairedCount, unpaired: d.studentCount - d.pairedCount })),
    [departmentSummaries]
  )

  const departmentAvgCwaBarData = useMemo(
    () =>
      departmentSummaries
        .filter((d) => d.avgCwa !== null)
        .slice()
        .sort((a, b) => (b.avgCwa ?? 0) - (a.avgCwa ?? 0))
        .slice(0, 7)
        .map((d) => ({
          department: d.department,
          avgCwa: Number((d.avgCwa ?? 0).toFixed(2)),
          maxCwa: d.maxCwa !== null ? Number(d.maxCwa.toFixed(2)) : null,
          minCwa: d.minCwa !== null ? Number(d.minCwa.toFixed(2)) : null,
        })),
    [departmentSummaries]
  )

  const chartConfig: ChartConfig = {
    mentees: { label: "Mentees", color: "#7c3aed" }, // violet-600
    students: { label: "Students", color: "#475569" }, // slate-600
    paired: { label: "Paired", color: "#059669" }, // emerald-600
    unpaired: { label: "Unpaired", color: "#f59e0b" }, // amber-500
    avgCwa: { label: "Avg CWA", color: "#2563eb" }, // blue-600
    maxCwa: { label: "Highest", color: "#0ea5e9" }, // sky-600
    minCwa: { label: "Lowest", color: "#ef4444" }, // red-500
  }

  const isLoading = studentsLoading || lecturersLoading

  // Exports removed per request

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Coordinator Analytics</h1>
              <p className="text-muted-foreground mt-1">Live insights on lecturers, mentees, and departments</p>
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                  <p className="text-sm font-medium text-slate-600">Total Students</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "…" : totalStudents}</p>
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
                  <p className="text-sm font-medium text-slate-600">Total Lecturers</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "…" : totalLecturers}</p>
                    </div>
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                  <p className="text-sm font-medium text-slate-600">Assigned to Mentors</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">{isLoading ? "…" : pairedStudents}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {isLoading || totalStudents === 0
                      ? ""
                      : `${((pairedStudents / totalStudents) * 100).toFixed(1)}% paired`}
                  </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent pointer-events-none"></div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                  <p className="text-sm font-medium text-slate-600">Unassigned</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">{isLoading ? "…" : unpairedStudents}</p>
                    </div>
                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-transparent pointer-events-none"></div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-xl border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                  Top Mentors by Mentees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={menteesPerLecturerTop} layout="vertical" margin={{ left: 16, right: 16, bottom: 8 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="lecturer" type="category" width={140} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="mentees" fill="var(--color-mentees)" radius={6} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="rounded-xl border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  Pairing Coverage by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={departmentStudentsBarData} layout="vertical" margin={{ left: 16, right: 16 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="department" type="category" width={160} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="paired" name="Paired" stackId="a" fill="var(--color-paired)" radius={[6, 0, 0, 6]} />
                    <Bar dataKey="unpaired" name="Unpaired" stackId="a" fill="var(--color-unpaired)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="rounded-xl border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Pairing Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <RePieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={pairedVsUnpairedData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                      {pairedVsUnpairedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#059669" : "#F59E0B"} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="rounded-xl border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Avg/Highest/Lowest CWA by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px]">
                  <BarChart data={departmentAvgCwaBarData} margin={{ left: 16, right: 16, bottom: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="department" tickLine={false} axisLine={false} interval={0} angle={-10} textAnchor="end" height={50} />
                    <YAxis domain={[0, 100]} />
                    <ReferenceLine y={50} stroke="#e5e7eb" />
                    <ReferenceLine y={70} stroke="#dbeafe" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="avgCwa" name="Avg CWA" fill="var(--color-avgCwa)" radius={6} />
                    <Bar dataKey="maxCwa" name="Highest" fill="var(--color-maxCwa)" radius={6} />
                    <Bar dataKey="minCwa" name="Lowest" fill="var(--color-minCwa)" radius={6} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
                    </div>

          {/* Department summary chips */}
          <div className="grid gap-4 md:grid-cols-3">
            {departmentSummaries
              .slice()
              .sort((a, b) => b.studentCount - a.studentCount)
              .slice(0, 6)
              .map((d) => (
                <Card key={d.department}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{d.department}</p>
                        <p className="text-xs text-muted-foreground">Lecturers: {d.lecturerCount}</p>
                    </div>
                      <Badge variant="secondary">{d.pairedCount}/{d.studentCount} paired</Badge>
                    </div>
                    {d.avgCwa !== null ? (
                      <p className="mt-2 text-sm">Avg CWA: <span className="font-medium">{d.avgCwa.toFixed(2)}</span></p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">Avg CWA: N/A</p>
                    )}
              </CardContent>
            </Card>
              ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 