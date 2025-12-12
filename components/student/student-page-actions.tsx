"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { StudentFormDialog } from "./student-form-dialog"

interface StudentPageActionsProps {
  onRefresh?: () => void
}

export function StudentPageActions({ onRefresh }: StudentPageActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowCreateDialog(true)}>
        <IconPlus className="mr-2 h-4 w-4" />
        Tambah Siswa
      </Button>

      <StudentFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={onRefresh}
      />
    </>
  )
}
