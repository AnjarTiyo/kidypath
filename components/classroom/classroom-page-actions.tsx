"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { ClassroomFormDialog } from "./classroom-form-dialog"

interface ClassroomPageActionsProps {
  onRefresh?: () => void
}

export function ClassroomPageActions({ onRefresh }: ClassroomPageActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowCreateDialog(true)}>
        <IconPlus className="mr-2 h-4 w-4" />
        Tambah Kelas
      </Button>

      <ClassroomFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={onRefresh}
      />
    </>
  )
}
