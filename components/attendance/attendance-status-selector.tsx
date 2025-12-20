"use client"

import { cn } from "@/lib/utils"
import { IconPill, IconFileText } from "@tabler/icons-react"

export type AttendanceStatus = "present" | "sick" | "permission"

interface StatusOption {
  value: AttendanceStatus
  label: string
  icon: React.ReactNode
  color: string
}

const statusOptions: StatusOption[] = [
  {
    value: "sick",
    label: "Sakit",
    icon: <IconPill className="h-6 w-6" />,
    color: "hover:bg-orange-100 hover:border-orange-400 data-[selected=true]:bg-orange-100 data-[selected=true]:border-orange-400",
  },
  {
    value: "permission",
    label: "Izin",
    icon: <IconFileText className="h-6 w-6" />,
    color: "hover:bg-sky-100 hover:border-sky-400 data-[selected=true]:bg-sky-100 data-[selected=true]:border-sky-400",
  },
]

interface AttendanceStatusSelectorProps {
  selectedStatus: AttendanceStatus | null
  onStatusSelect: (status: AttendanceStatus) => void
  disabled?: boolean
}

export function AttendanceStatusSelector({
  selectedStatus,
  onStatusSelect,
  disabled = false,
}: AttendanceStatusSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {statusOptions.map((status) => (
        <button
          key={status.value}
          type="button"
          data-selected={selectedStatus === status.value}
          className={cn(
            "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            status.color,
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer active:scale-95"
          )}
          onClick={() => !disabled && onStatusSelect(status.value)}
          disabled={disabled}
        >
          <div className="mb-1">{status.icon}</div>
          <div className="font-semibold text-sm">{status.label}</div>
        </button>
      ))}
    </div>
  )
}

export { statusOptions }
