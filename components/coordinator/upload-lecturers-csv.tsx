"use client"

import { useState } from "react"
import Papa from "papaparse"
import { UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { usePairingStore } from "@/hooks/use-pairing-store"

export default function UploadLecturersCSV() {
  const { addLecturersBulk } = usePairingStore()
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = (file: File) => {
    if (!file.type.includes("csv")) {
      toast.error("Please upload a CSV file")
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Expecting headers: name, email, department, status
        const parsed = (results.data as any[]).map((row) => {
          const fullName = row.name?.trim() || ""
          const nameParts = fullName.split(' ')
          return {
            firstname: nameParts[0] || "",
            lastname: nameParts.slice(1).join(' ') || "",
            email: row.email?.trim(),
            department: row.department?.trim() || "",
            status: (row.status?.trim() as "active" | "inactive") || "active",
          }
        }).filter((r) => r.firstname && r.email)

        if (parsed.length === 0) {
          toast.error("No valid rows found in CSV")
          return
        }

        addLecturersBulk(parsed as any)
        setFileName(file.name)
        toast.success(`Imported ${parsed.length} lecturers successfully`)
      },
      error: () => toast.error("Failed to parse CSV"),
    })
  }

  const fileInputProps = {
    type: "file" as const,
    accept: ".csv",
    className: "hidden",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) handleFile(f as unknown as File)
    },
  }

  return (
    <div className="flex flex-col gap-4 items-center justify-center border border-dashed border-input rounded-lg p-8">
      <label className="flex flex-col items-center gap-2 cursor-pointer">
        <UploadCloud className="size-8 text-muted-foreground" />
        <span className="text-sm">Drag & drop or click to upload CSV</span>
        <input {...fileInputProps} />
      </label>
      {fileName && <p className="text-sm text-muted-foreground">Last uploaded: {fileName}</p>}
    </div>
  )
} 