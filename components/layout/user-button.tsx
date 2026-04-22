"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { User, LogOut, Settings } from "lucide-react"

export function UserButton() {
    const { data: session, status } = useSession()
    const [showLogoutDialog, setShowLogoutDialog] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        await signOut({ callbackUrl: "/auth/login" })
    }

    const openLogoutDialog = () => {
        setIsPopoverOpen(false)
        setShowLogoutDialog(true)
    }

    if (status === "loading") {
        return <UserButtonSkeleton />
    }

    if (!session) {
        return null
    }

    const ROLE_LABELS: Record<string, string> = {
        admin: "Administrator",
        teacher: "Teacher",
        curriculum: "Koor. Kurikulum",
        parent: "Orang Tua",
    }
    const roleLabel = ROLE_LABELS[session.user?.role ?? ""] ?? session.user?.role

    const userName = session.user?.name || session.user?.email || "User"
    const userInitials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-10 gap-3 rounded-sm px-2 md:w-auto md:px-3 group"
                        disabled={isLoggingOut}
                    >
                        <div className="hidden md:flex md:flex-col md:items-end md:text-right">
                            <span className="text-sm font-medium text-foreground group-hover:!text-foreground">{userName}</span>
                            <span className="text-xs text-muted-foreground capitalize group-hover:!text-muted-foreground">
                                {roleLabel}
                            </span>
                        </div>
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>

                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                    <div className="flex flex-col">
                        {/* User Info Section */}
                        <div className="flex items-center gap-3 p-4">
                            <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-1 flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none truncate">
                                    {userName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {session.user?.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {roleLabel}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Menu Items */}
                        <div className="p-1">
                            {/* Profile Edit - Future Work */}
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-muted-foreground cursor-not-allowed opacity-50"
                                disabled
                            >
                                <User className="h-4 w-4" />
                                <span className="text-sm">Edit Profile</span>
                                <span className="ml-auto text-xs">(Soon)</span>
                            </Button>

                            {/* Settings - Future Work */}
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-muted-foreground cursor-not-allowed opacity-50"
                                disabled
                            >
                                <Settings className="h-4 w-4" />
                                <span className="text-sm">Settings</span>
                                <span className="ml-auto text-xs">(Soon)</span>
                            </Button>

                            <Separator className="my-1" />

                            {/* Logout */}
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={openLogoutDialog}
                                disabled={isLoggingOut}
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm">
                                    {isLoggingOut ? "Logging out..." : "Logout"}
                                </span>
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin keluar dari sistem? Anda perlu login kembali untuk mengakses aplikasi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoggingOut}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="bg-destructive text-primary-foreground hover:bg-destructive/90"
                        >
                            {isLoggingOut ? "Logging out..." : "Ya, Logout"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export function UserButtonSkeleton() {
    return (
        <div className="flex items-center gap-3 px-2 md:px-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="hidden md:flex md:flex-col md:gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    )
}
