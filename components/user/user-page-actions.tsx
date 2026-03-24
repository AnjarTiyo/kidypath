"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { UserFormDialog } from "./user-form-dialog"

interface UserPageActionsProps {
  onRefresh?: () => void
}

export function UserPageActions({ onRefresh }: UserPageActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isCreateOpen = searchParams.get("modal") === "create"

  return (
    <>
      <Button onClick={() => router.replace(`${pathname}?modal=create`)}>
        <IconPlus className="mr-2 h-4 w-4" />
        Add User
      </Button>

      <UserFormDialog
        open={isCreateOpen}
        onOpenChange={(open) => !open && router.replace(pathname)}
        onSuccess={onRefresh}
      />
    </>
  )
}
