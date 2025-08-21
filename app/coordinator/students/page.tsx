"use client"

import { useEffect } from "react"
import { useRole } from "@/components/role-context"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import StudentsDirectory from "@/components/coordinator/students-directory"

export default function StudentsPage() {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role === "Lecturer") {
      router.replace("/lecturer/mentees");
    }
  }, [role, router]);

  if (role === "Lecturer") return null;

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
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <StudentsDirectory />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 