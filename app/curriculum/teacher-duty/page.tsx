"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/layout/page-header"
import { IconHome, IconSchool, IconUser, IconSearch } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { useTeacherDuty, type TeacherData } from "@/lib/hooks/use-teacher-duty"
import { DutyTeacherCard, TeacherListCard, DutyConfirmDialog } from "@/components/teacher-duty"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TeacherDutyManagementPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const { dutyTeachers, allTeachers, loading, error, refetch } = useTeacherDuty()

    const isCurriculumCoordinator = useMemo(() => {
        return session?.user?.isCurriculumCoordinator || session?.user?.role === "admin"
    }, [session])

    useEffect(() => {
        if (status !== "loading" && !isCurriculumCoordinator) {
            router.replace("/unauthorized")
        }
    }, [status, isCurriculumCoordinator, router])

    const [assignDialog, setAssignDialog] = useState<{ open: boolean; teacher?: TeacherData }>({ open: false })
    const [removeDialog, setRemoveDialog] = useState<{ open: boolean; teacher?: TeacherData }>({ open: false })
    const [search, setSearch] = useState("")

    const dutyIds = useMemo(() => new Set(dutyTeachers.map((t) => t.id)), [dutyTeachers])

    const filteredTeachers = useMemo(() => {
        const q = search.toLowerCase().trim()
        if (!q) return allTeachers
        return allTeachers.filter(
            (t) =>
                t.name?.toLowerCase().includes(q) ||
                t.email?.toLowerCase().includes(q)
        )
    }, [allTeachers, search])

    if (status === "loading") {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <Skeleton className="h-5 w-1/3 mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <>
            <PageHeader
                title="Guru Piket"
                description="Kelola guru yang bertugas piket hari ini"
                breadcrumbs={[
                    { label: "Beranda", href: "/", icon: IconHome },
                    { label: "Manajemen Kurikulum", href: "/curriculum", icon: IconSchool },
                    { label: "Manajemen Guru Piket", href: "/curriculum/teacher-duty", icon: IconUser },
                ]}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {/* Left: On-duty teachers */}
                <Card className="md:col-span-1 space-y-3">
                    <CardHeader className="border-b">
                        <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
                            Guru Piket Hari Ini
                        </CardTitle>
                        <span>
                            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </span>
                    </CardHeader>

                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(2)].map((_, i) => (
                                    <Card key={i}>
                                        <CardContent className="p-4">
                                            <Skeleton className="h-5 w-1/2 mb-2" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : dutyTeachers.length === 0 ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="p-6 flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground text-center">
                                        Belum ada guru piket hari ini
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {dutyTeachers.map((teacher) => (
                                    <DutyTeacherCard
                                        key={teacher.id}
                                        teacher={teacher}
                                        onRemove={() => setRemoveDialog({ open: true, teacher })}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: All teachers */}
                <Card className="md:col-span-2 space-y-3">
                    <CardHeader className="border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
                            Semua Guru
                        </CardTitle>
                        <div className="relative w-64">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama atau email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>

                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(4)].map((_, i) => (
                                    <Card key={i}>
                                        <CardContent className="p-4">
                                            <Skeleton className="h-5 w-1/3 mb-2" />
                                            <Skeleton className="h-4 w-2/3" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : filteredTeachers.length === 0 ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="p-6 flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground text-center">
                                        {search ? "Guru tidak ditemukan" : "Tidak ada data guru"}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filteredTeachers.map((teacher) => (
                                    <TeacherListCard
                                        key={teacher.id}
                                        teacher={teacher}
                                        isOnDuty={dutyIds.has(teacher.id)}
                                        onAssign={() => setAssignDialog({ open: true, teacher })}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assign Confirmation Dialog */}
            <DutyConfirmDialog
                open={assignDialog.open}
                onOpenChange={(open) => setAssignDialog((s) => ({ ...s, open }))}
                title="Tambah Guru Piket"
                description={`Tambahkan ${assignDialog.teacher?.name ?? "guru ini"} sebagai guru piket hari ini?`}
                confirmLabel="Tambah"
                onConfirm={async () => {
                    const res = await fetch("/api/teacher-duty", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ teacherId: assignDialog.teacher?.id }),
                    })
                    if (!res.ok) {
                        const body = await res.json().catch(() => ({}))
                        throw new Error(body.error ?? "Gagal menambahkan guru piket")
                    }
                    await refetch()
                }}
            />

            {/* Remove Confirmation Dialog */}
            <DutyConfirmDialog
                open={removeDialog.open}
                onOpenChange={(open) => setRemoveDialog((s) => ({ ...s, open }))}
                title="Hapus Guru Piket"
                description={`Hapus ${removeDialog.teacher?.name ?? "guru ini"} dari daftar guru piket hari ini?`}
                confirmLabel="Hapus"
                confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onConfirm={async () => {
                    const res = await fetch(`/api/teacher-duty/${removeDialog.teacher?.id}`, {
                        method: "DELETE",
                    })
                    if (!res.ok) {
                        const body = await res.json().catch(() => ({}))
                        throw new Error(body.error ?? "Gagal menghapus guru piket")
                    }
                    await refetch()
                }}
            />
        </>
    )
}