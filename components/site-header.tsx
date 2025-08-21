"use client"

import { useRole, type Role } from "@/components/role-context"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { 
  IconShield
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"

export function SiteHeader() {
  const { role } = useRole()
  const { user } = useAuth()
  const pathname = usePathname()

  const getTitle = (path: string) => {
    if (path === "/") return "Home"
    if (path.startsWith("/coordinator/upload")) return "Upload Results"
    if (path.startsWith("/coordinator/students")) return "Manage Students"
    if (path.startsWith("/coordinator/lecturers")) return "Manage Lecturers"
    if (path.startsWith("/coordinator/analytics")) return "View Analytics"
    if (path.startsWith("/coordinator")) return "Coordinator"
    if (path.startsWith("/lecturer/mentees")) return "My Mentees"
    if (path.startsWith("/lecturer/analytics")) return "Analytics Overview"
    if (path.startsWith("/lecturer")) return "Lecturer"
    if (path.startsWith("/dashboard")) return "Dashboard"
    return "Document"
  }

  const pageTitle = getTitle(pathname)

  const userInfo = {
    name: (user?.user_metadata as any)?.name ?? user?.email?.split("@")[0] ?? "User",
    email: user?.email ?? "",
    avatar: (user?.user_metadata as any)?.avatar_url ?? "/logo.png"
  }

  const getRoleBadge = () => {
    // Only show admin badge for coordinators
    if (role === "Coordinator") {
      return (
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          <IconShield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      )
    }
    return null
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center gap-4 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        
        <Separator orientation="vertical" className="mx-2 h-6" />
        
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-purple-600 text-white font-semibold text-sm">
              {userInfo.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{userInfo.name}</p>
              {getRoleBadge()}
            </div>
            <p className="text-xs text-muted-foreground">{userInfo.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
