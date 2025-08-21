"use client"

import { IconLogout } from "@tabler/icons-react"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavUser() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <IconLogout className="h-5 w-5" />
          <span className="font-medium">Sign out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
