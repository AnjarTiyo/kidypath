"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { DayOffFormDialog } from "./day-off-form-dialog"

interface DayOffPageActionsProps {
  onRefresh?: () => void
}

export function DayOffPageActions({ onRefresh }: DayOffPageActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowCreateDialog(true)}>
        <IconPlus className="mr-2 h-4 w-4" />
        Tambah Hari Libur
      </Button>

      <DayOffFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={onRefresh}
      />
    </>
  )
}
