"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Users, 
  TrendingUp, 
  GraduationCap,
  Trophy,
  AlertTriangle,
  BarChart3,
  PieChart,
  Lightbulb,
} from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface StudentWithMentor {
  index_number: string
  name: string
  cwa: number
  year: number
  department: string
  trend?: "up" | "down" | "stable"
}

interface YearGroupStats {
  year: number
  count: number
  avgCwa: number
  highestCwa: number
  lowestCwa: number
  excellentCount: number
  needsAttentionCount: number
  excellentPercent: number
  needsPercent: number
  totalCwa: number
}

const getYearLabel = (year: number) => {
  const suffixes = ['st', 'nd', 'rd', 'th']
  const suffix = suffixes[year - 1] || 'th'
  return `${year}${suffix} Year`
}

export default function LecturerAnalytics() {
  const [mentees, setMentees] = useState<StudentWithMentor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const { user, loading: authLoading } = useAuth()

  // Fetch mentees from database
  useEffect(() => {
    const fetchMentees = async (lecturerEmail: string) => {
      try {
        setLoading(true)
        const res = await fetch(`/api/lecturer/mentees?email=${encodeURIComponent(lecturerEmail)}`)
        if (!res.ok) {
          setMentees([])
          return
        }
        const payload = await res.json()
        const menteesData: StudentWithMentor[] = (payload.mentees || []).map((s: any) => ({
          index_number: s.index_number,
          name: `${s.firstname} ${s.lastname}`,
          cwa: s.current_cwa || 0,
          year: s.year,
          department: s.department || 'Unknown',
          trend: 'stable',
        }))
        setMentees(menteesData)
      } catch {
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

    fetchMentees(user.email)
  }, [authLoading, user?.email])

  // Calculate statistics by year
  const yearStats = useMemo(() => {
    const stats = mentees.reduce((acc, student) => {
      if (!acc[student.year]) {
        acc[student.year] = { 
          year: student.year,
          count: 0, 
          avgCwa: 0, 
          totalCwa: 0, 
          highestCwa: 0, 
          lowestCwa: 100,
          excellentCount: 0,
          needsAttentionCount: 0,
          excellentPercent: 0,
          needsPercent: 0
        }
      }
      acc[student.year].count++
      acc[student.year].totalCwa += student.cwa
      acc[student.year].highestCwa = Math.max(acc[student.year].highestCwa, student.cwa)
      acc[student.year].lowestCwa = Math.min(acc[student.year].lowestCwa, student.cwa)
      if (student.cwa >= 70) acc[student.year].excellentCount++
      if (student.cwa < 50) acc[student.year].needsAttentionCount++
      
      return acc
    }, {} as Record<number, YearGroupStats>)
    
    return Object.values(stats).map((data) => ({
      ...data,
      avgCwa: data.totalCwa / data.count,
      excellentPercent: (data.excellentCount / data.count) * 100,
      needsPercent: (data.needsAttentionCount / data.count) * 100
    })).sort((a, b) => a.year - b.year)
  }, [mentees])

  // Filter mentees based on selected filters
  const filteredMentees = useMemo(() => {
    let filtered = mentees
    if (selectedYear !== "all") {
      filtered = filtered.filter(student => student.year.toString() === selectedYear)
    }
    return filtered
  }, [mentees, selectedYear])

  // Risk classification helpers
  const getRiskCategory = (cwa: number) => {
    if (cwa < 50) return "At Risk"
    if (cwa < 60) return "Watchlist"
    if (cwa < 70) return "Progressing"
    return "Thriving"
  }

  // Key metrics
  const totalMentees = filteredMentees.length
  const avgCwa = totalMentees > 0 ? filteredMentees.reduce((sum, s) => sum + s.cwa, 0) / totalMentees : 0
  const excellentCount = filteredMentees.filter(s => s.cwa >= 70).length
  const needsAttentionCount = filteredMentees.filter(s => s.cwa < 50).length
  const excellentPercent = totalMentees > 0 ? (excellentCount / totalMentees) * 100 : 0
  const needsPercent = totalMentees > 0 ? (needsAttentionCount / totalMentees) * 100 : 0
  const watchlistCount = filteredMentees.filter(s => s.cwa >= 50 && s.cwa < 60).length
  const watchlistPercent = totalMentees > 0 ? (watchlistCount / totalMentees) * 100 : 0

  // Chart data
  const performanceDistributionData = {
    labels: ['Excellent (70+)', 'Good (60-69)', 'Fair (50-59)', 'Needs Attention (<50)'],
    datasets: [
      {
        data: [
          filteredMentees.filter(s => s.cwa >= 70).length,
          filteredMentees.filter(s => s.cwa >= 60 && s.cwa < 70).length,
          filteredMentees.filter(s => s.cwa >= 50 && s.cwa < 60).length,
          filteredMentees.filter(s => s.cwa < 50).length
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      }
    ]
  }

  const yearPerformanceData = {
    labels: yearStats.map(stat => getYearLabel(stat.year)),
    datasets: [
      {
        label: 'Average CWA',
        data: yearStats.map(stat => stat.avgCwa),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Highest',
        data: yearStats.map(stat => stat.highestCwa),
        backgroundColor: 'rgba(14, 165, 233, 0.6)',
        borderRadius: 6,
      },
      {
        label: 'Lowest',
        data: yearStats.map(stat => stat.lowestCwa),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderRadius: 6,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  }

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  }

  // Priority lists
  const topAtRisk = useMemo(() => (
    [...filteredMentees]
      .filter(s => s.cwa < 50)
      .sort((a, b) => a.cwa - b.cwa)
      .slice(0, 5)
  ), [filteredMentees])

  const topWatchlist = useMemo(() => (
    [...filteredMentees]
      .filter(s => s.cwa >= 50 && s.cwa < 60)
      .sort((a, b) => a.cwa - b.cwa)
      .slice(0, 5)
  ), [filteredMentees])

  const uniqueYears = useMemo(() => {
    const years = [...new Set(mentees.map(student => student.year))]
    return years.sort()
  }, [mentees])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Success Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights to prioritize support and improve outcomes</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <GraduationCap className="w-4 h-4 text-muted-foreground" />
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {uniqueYears.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {getYearLabel(year)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics - clean single row */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Mentees</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalMentees}</p>
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
              <p className="text-sm font-medium text-slate-600">Thriving (70+)</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{excellentCount}</p>
              <p className="text-xs text-slate-500 mt-1">{excellentPercent.toFixed(1)}% of mentees</p>
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
              <p className="text-sm font-medium text-slate-600">At Risk (&lt;50)</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{needsAttentionCount}</p>
              <p className="text-xs text-slate-500 mt-1">{needsPercent.toFixed(1)}% of mentees</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent pointer-events-none"></div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Average CWA</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{avgCwa.toFixed(1)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Doughnut data={performanceDistributionData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Average CWA by Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={yearPerformanceData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year Group Summary */}
      {yearStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              Year Group Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              {yearStats.map((stat) => (
                <div key={stat.year} className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-base">{getYearLabel(stat.year)}</h3>
                    <Badge variant="secondary" className="text-[11px] px-2 py-0.5">{stat.count} mentees</Badge>
                  </div>
                  
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg CWA:</span>
                      <span className="font-medium">{stat.avgCwa.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Excellent:</span>
                      <span className="font-medium text-green-600">{stat.excellentCount} ({stat.excellentPercent.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Needs Help:</span>
                      <span className="font-medium text-red-600">{stat.needsAttentionCount} ({stat.needsPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority Interventions */}
      <Card className="rounded-xl border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-indigo-600" />
            Priority Interventions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Top At-Risk</h4>
              </div>
              {topAtRisk.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students currently below 50 CWA.</p>
              ) : (
                <div className="space-y-2">
                  {topAtRisk.map((s) => (
                    <div key={s.index_number} className="flex items-center justify-between border rounded-md p-2">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.index_number} • Year {s.year} • CWA {s.cwa.toFixed(1)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">At Risk</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Suggested actions: schedule a 1:1 check-in, create a study plan, recommend tutoring, and set weekly progress goals.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Watchlist</h4>
              </div>
              {topWatchlist.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students in the 50-59 band.</p>
              ) : (
                <div className="space-y-2">
                  {topWatchlist.map((s) => (
                    <div key={s.index_number} className="flex items-center justify-between border rounded-md p-2">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.index_number} • Year {s.year} • CWA {s.cwa.toFixed(1)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Watchlist</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Suggested actions: send study tips, invite to group session, and monitor weekly grade updates.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 