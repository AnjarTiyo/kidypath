"use client"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { IconDots, IconEdit, IconTrash } from "@tabler/icons-react"
import { UserFormDialog } from "@/components/user/user-form-dialog"
import { DeleteUserDialog } from "@/components/user/delete-user-dialog"
import { User } from "@/components/user/user-columns"


interface UserActionsProps {
  user: User
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isEditOpen =
    searchParams.get("modal") === "edit" && searchParams.get("userId") === user.id

  const openEdit = () => {
    router.replace(`${pathname}?modal=edit&userId=${user.id}`)
  }

  const closeEdit = () => {
    router.replace(pathname)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(user.id)}
          >
            Copy user ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openEdit}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserFormDialog
        user={user}
        open={isEditOpen}
        onOpenChange={(open) => !open && closeEdit()}
      />
      <DeleteUserDialog
        user={user}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  )
}
