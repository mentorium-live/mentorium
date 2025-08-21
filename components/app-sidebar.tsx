"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconUsers,
  IconSchool,
  IconUpload,
  IconChartBar,
} from "@tabler/icons-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useRole } from "@/components/role-context"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { usePathname } from "next/navigation"

const coordinatorNavItems = [
  {
    title: "Students",
    url: "/coordinator/students",
    icon: IconUsers,
  },
  {
    title: "Lecturers",
    url: "/coordinator/lecturers",
    icon: IconSchool,
  },
  {
    title: "Upload Results",
    url: "/coordinator/upload",
    icon: IconUpload,
  },
  {
    title: "Analytics",
    url: "/coordinator/analytics",
    icon: IconChartBar,
  },
]

const lecturerNavItems = [
  {
    title: "My Mentees",
    url: "/lecturer/mentees",
    icon: IconUsers,
  },
  {
    title: "Analytics",
    url: "/lecturer/analytics",
    icon: IconChartBar,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role } = useRole()
  const pathname = usePathname()

  const navItems = role === "Coordinator" ? coordinatorNavItems : lecturerNavItems

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="Mentorium"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      tooltip={item.title} 
                      asChild 
                      isActive={isActive}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
