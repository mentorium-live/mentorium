import { redirect } from "next/navigation"

export default function LecturerRootPage() {
  redirect("/lecturer/mentees")
  return null
}
