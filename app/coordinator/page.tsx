import { redirect } from "next/navigation"

export default function CoordinatorRootPage() {
  redirect("/coordinator/students")
  return null
} 