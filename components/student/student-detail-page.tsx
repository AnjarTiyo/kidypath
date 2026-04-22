"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { IconHome, IconSchool, IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { IconMars, IconVenus, IconCalendar, IconUser, IconUsers } from "@tabler/icons-react"

interface StudentDetailPageProps {
  studentId: string
}

interface Student {
  id: string
  fullName: string
  birthDate: string | null
  gender: string
  classroomId: string | null
  classroomName: string | null
  parents: Array<{
    id: string
    name: string | null
    email: string | null
  }>
  createdAt: Date
}

export function StudentDetailPage({ studentId }: StudentDetailPageProps) {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/students/${studentId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch student data")
        }

        const data = await response.json()
        setStudent(data)
      } catch (err) {
        console.error("Error fetching student:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [studentId])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detail Siswa"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin", icon: IconHome },
            { label: "Siswa", href: "/admin/student", icon: IconSchool },
            { label: "Detail" },
          ]}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detail Siswa"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin", icon: IconHome },
            { label: "Siswa", href: "/admin/student", icon: IconSchool },
            { label: "Detail" },
          ]}
        />
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {error || "Siswa tidak ditemukan"}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const age = student.birthDate
    ? Math.floor(
        (new Date().getTime() - new Date(student.birthDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.fullName}
        description="Informasi lengkap siswa dan laporan perkembangan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin", icon: IconHome },
          { label: "Siswa", href: "/admin/student", icon: IconSchool },
          { label: student.fullName },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push("/admin/student")}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
            <CardDescription>Data diri siswa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                <div className="flex items-center gap-2">
                  {student.gender === "male" ? (
                    <IconMars className="h-4 w-4 text-blue-500" />
                  ) : (
                    <IconVenus className="h-4 w-4 text-pink-500" />
                  )}
                  <p className="text-base font-semibold">{student.fullName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Jenis Kelamin</p>
              <p className="text-base">
                {student.gender === "male" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tanggal Lahir</p>
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                {student.birthDate ? (
                  <div>
                    <p className="text-base">
                      {new Date(student.birthDate).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {age !== null && (
                      <p className="text-sm text-muted-foreground">{age} tahun</p>
                    )}
                  </div>
                ) : (
                  <p className="text-base text-muted-foreground">-</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Kelas</p>
              {student.classroomName ? (
                <Badge variant="outline" className="text-base">
                  {student.classroomName}
                </Badge>
              ) : (
                <p className="text-base text-muted-foreground">Belum ditugaskan</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Parents Information */}
        <Card>
          <CardHeader>
            <CardTitle>Orang Tua / Wali</CardTitle>
            <CardDescription>Informasi orang tua siswa</CardDescription>
          </CardHeader>
          <CardContent>
            {student.parents && student.parents.length > 0 ? (
              <div className="space-y-4">
                {student.parents.map((parent) => (
                  <div
                    key={parent.id}
                    className="flex items-start gap-3 rounded-sm border p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                      <IconUser className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{parent.name || "Nama tidak tersedia"}</p>
                      {parent.email && (
                        <p className="text-sm text-muted-foreground">{parent.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <IconUsers className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Belum ada orang tua yang ditugaskan
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reports Section - Placeholder for future implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Laporan Perkembangan</CardTitle>
          <CardDescription>
            Riwayat penilaian dan laporan perkembangan siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-secondary p-4">
              <IconSchool className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Segera Hadir</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Fitur laporan perkembangan siswa akan tersedia di update mendatang. Anda akan
              dapat melihat penilaian harian, laporan mingguan, dan laporan bulanan di sini.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
