"use client"

import { useState } from "react"
import { IconEdit, IconTrash, IconDotsVertical } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DayOff } from "./day-off-columns"
import { DayOffFormDialog } from "./day-off-form-dialog"
import { DeleteDayOffDialog } from "./delete-day-off-dialog"

interface DayOffActionsProps {
  dayOff: DayOff
  onRefresh: () => void
}

export function DayOffActions({ dayOff, onRefresh }: DayOffActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <IconDotsVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DayOffFormDialog
        dayOff={dayOff}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onRefresh}
      />

      <DeleteDayOffDialog
        dayOff={dayOff}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onRefresh}
      />
    </>
  )
}
