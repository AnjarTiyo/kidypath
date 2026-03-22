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
import { Classroom } from "./classroom-columns"
import { ClassroomFormDialog } from "./classroom-form-dialog"
import { DeleteClassroomDialog } from "./delete-classroom-dialog"

interface ClassroomActionsProps {
  classroom: Classroom
  onRefresh: () => void
}

export function ClassroomActions({ classroom, onRefresh }: ClassroomActionsProps) {
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

      <ClassroomFormDialog
        classroom={classroom}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onRefresh}
      />

      <DeleteClassroomDialog
        classroom={classroom}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onRefresh}
      />
    </>
  )
}
