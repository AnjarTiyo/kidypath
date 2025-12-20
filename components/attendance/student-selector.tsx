"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { IconUser, IconSearch, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export interface Student {
  id: string
  fullName: string | null
}

interface StudentSelectorProps {
  students: Student[]
  selectedStudent: Student | null
  onStudentSelect: (student: Student) => void
  disabled?: boolean
}

export function StudentSelector({
  students,
  selectedStudent,
  onStudentSelect,
  disabled = false,
}: StudentSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredStudents = students.filter((student) =>
    student.fullName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (student: Student) => {
    onStudentSelect(student)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <IconUser className="h-4 w-4" />
            {selectedStudent ? selectedStudent.fullName : "Pilih siswa..."}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Tidak ada siswa ditemukan
            </div>
          ) : (
            <div className="p-1">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleSelect(student)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-accent",
                    selectedStudent?.id === student.id && "bg-accent"
                  )}
                >
                  <span>{student.fullName}</span>
                  {selectedStudent?.id === student.id && (
                    <IconCheck className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
