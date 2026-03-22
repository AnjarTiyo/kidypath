"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { UserFormDialog } from "./user-form-dialog"

interface UserPageActionsProps {
  onRefresh?: () => void
}

export function UserPageActions({ onRefresh }: UserPageActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowCreateDialog(true)}>
        <IconPlus className="mr-2 h-4 w-4" />
        Add User
      </Button>

      <UserFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={onRefresh}
      />
    </>
  )
}
