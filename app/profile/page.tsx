"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  IconCamera,
  IconCheck,
  IconLoader2,
  IconUser,
  IconLock,
  IconChartBar,
  IconSchool,
  IconUsers,
  IconBook,
  IconCalendarStats,
  IconLayoutList,
  IconArrowLeft,
} from "@tabler/icons-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeacherStats {
  classrooms: { id: string; name: string | null; academicYear: string | null }[]
  classroomCount: number
  studentCount: number
  lessonPlanCount: number
  attendanceThisMonth: number
}

interface AdminStats {
  userCount: number
  classroomCount: number
}

interface Child {
  id: string
  fullName: string | null
  displayName: string | null
  avatarUrl: string | null
  classroomId: string | null
  birthDate: string | null
  gender: string | null
  latestAttendance: { date: string | null; status: string | null } | null
}

interface ParentStats {
  children: Child[]
  childrenCount: number
}

interface CurriculumStats {
  semesterTopicCount: number
  monthlyTopicCount: number
  weeklyTopicCount: number
}

interface ProfileUser {
  id: string
  fullName: string | null
  displayName: string | null
  email: string | null
  phoneNumber: string | null
  avatarUrl: string | null
  role: string | null
  isCurriculumCoordinator: boolean | null
  createdAt: string | null
}

interface ProfileData {
  user: ProfileUser
  stats: TeacherStats | AdminStats | ParentStats | CurriculumStats
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  teacher: "Guru",
  curriculum: "Koor. Kurikulum",
  parent: "Orang Tua",
}

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "Hadir",
  sick: "Sakit",
  permission: "Izin",
}

const ATTENDANCE_STATUS_VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  present: "default",
  sick: "destructive",
  permission: "secondary",
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ─── Statistics Section ───────────────────────────────────────────────────────

function StatsSection({ role, stats }: { role: string; stats: ProfileData["stats"] }) {
  if (role === "teacher") {
    const s = stats as TeacherStats
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={IconSchool} label="Kelas Diampu" value={s.classroomCount} />
          <StatCard icon={IconUsers} label="Total Murid" value={s.studentCount} />
          <StatCard icon={IconBook} label="RPP Dibuat" value={s.lessonPlanCount} />
          <StatCard
            icon={IconCalendarStats}
            label="Presensi Bulan Ini"
            value={s.attendanceThisMonth}
          />
        </div>
        {s.classrooms.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Kelas yang Diampu</p>
            <div className="flex flex-wrap gap-2">
              {s.classrooms.map((c) => (
                <Badge key={c.id} variant="secondary">
                  {c.name} {c.academicYear && `(${c.academicYear})`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (role === "admin") {
    const s = stats as AdminStats
    return (
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={IconUsers} label="Total Pengguna" value={s.userCount} />
        <StatCard icon={IconSchool} label="Total Kelas" value={s.classroomCount} />
      </div>
    )
  }

  if (role === "parent") {
    const s = stats as ParentStats
    return (
      <div className="space-y-3">
        <StatCard icon={IconUsers} label="Jumlah Anak" value={s.childrenCount} />
        {s.children.map((child) => (
          <div
            key={child.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {child.avatarUrl && <AvatarImage src={child.avatarUrl} />}
                <AvatarFallback className="text-xs">
                  {(child.fullName ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{child.fullName}</p>
                {child.latestAttendance?.date && (
                  <p className="text-xs text-muted-foreground">
                    Presensi terakhir: {child.latestAttendance.date}
                  </p>
                )}
              </div>
            </div>
            {child.latestAttendance?.status && (
              <Badge
                variant={
                  ATTENDANCE_STATUS_VARIANT[child.latestAttendance.status] ?? "outline"
                }
              >
                {ATTENDANCE_STATUS_LABELS[child.latestAttendance.status] ??
                  child.latestAttendance.status}
              </Badge>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (role === "curriculum") {
    const s = stats as CurriculumStats
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={IconLayoutList} label="Topik Semester" value={s.semesterTopicCount} />
        <StatCard icon={IconLayoutList} label="Topik Bulanan" value={s.monthlyTopicCount} />
        <StatCard icon={IconLayoutList} label="Topik Mingguan" value={s.weeklyTopicCount} />
      </div>
    )
  }

  return null
}

// ─── Profile Info Form ────────────────────────────────────────────────────────

function ProfileInfoForm({
  user,
  onSaved,
}: {
  user: ProfileUser
  onSaved: (updated: Partial<ProfileUser>) => void
}) {
  const [form, setForm] = useState({
    fullName: user.fullName ?? "",
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    phoneNumber: user.phoneNumber ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan profil")
        return
      }
      setSuccess(true)
      onSaved(data)
      setTimeout(() => setSuccess(false), 2500)
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <Input
            id="fullName"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Nama lengkap"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Nama Tampil</Label>
          <Input
            id="displayName"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Nama yang ditampilkan"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@contoh.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber">No. HP</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            placeholder="081234567890"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? (
            <IconLoader2 size={14} className="animate-spin mr-1.5" />
          ) : success ? (
            <IconCheck size={14} className="mr-1.5 text-green-600" />
          ) : null}
          {success ? "Tersimpan" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  )
}

// ─── Change Password Form ─────────────────────────────────────────────────────

function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (form.newPassword !== form.confirmPassword) {
      setError("Password baru dan konfirmasi tidak cocok")
      return
    }
    if (form.newPassword.length < 6) {
      setError("Password baru harus minimal 6 karakter")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah password")
        return
      }
      setSuccess(true)
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setTimeout(() => setSuccess(false), 2500)
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <IconCheck size={14} />
          Password berhasil diubah
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Password Saat Ini</Label>
        <Input
          id="currentPassword"
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          placeholder="••••••••"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Password Baru</Label>
          <Input
            id="newPassword"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="Minimal 6 karakter"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Ulangi password baru"
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={loading} size="sm" variant="outline">
        {loading && <IconLoader2 size={14} className="animate-spin mr-1.5" />}
        Ubah Password
      </Button>
    </form>
  )
}

// ─── Avatar Picker ────────────────────────────────────────────────────────────

function AvatarPicker({
  currentUrl,
  userName,
  onUploaded,
}: {
  currentUrl: string | null
  userName: string
  onUploaded: (url: string) => void
}) {
  const { update } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      setUploading(true)

      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/profile/avatar", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) {
          setPreviewUrl(currentUrl)
          alert(data.error ?? "Gagal mengunggah avatar")
          return
        }
        setPreviewUrl(data.avatarUrl)
        onUploaded(data.avatarUrl)
        // Refresh the NextAuth session token so header avatar updates
        await update({ avatarUrl: data.avatarUrl })
      } catch {
        setPreviewUrl(currentUrl)
        alert("Gagal mengunggah avatar. Coba lagi.")
      } finally {
        setUploading(false)
        URL.revokeObjectURL(objectUrl)
        // Reset the file input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    },
    [currentUrl, onUploaded, update]
  )

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-20 w-20">
          {previewUrl && <AvatarImage src={previewUrl} alt={userName} />}
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <IconLoader2 size={20} className="animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5"
        >
          <IconCamera size={14} />
          {uploading ? "Mengunggah..." : "Ganti Foto"}
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP • Maks 5 MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setProfile(data)
        }
      })
      .catch(() => setError("Gagal memuat data profil"))
      .finally(() => setLoading(false))
  }, [])

  const handleProfileSaved = useCallback(
    (updated: Partial<ProfileUser>) => {
      setProfile((prev) =>
        prev ? { ...prev, user: { ...prev.user, ...updated } } : prev
      )
    },
    []
  )

  const handleAvatarUploaded = useCallback((url: string) => {
    setProfile((prev) =>
      prev ? { ...prev, user: { ...prev.user, avatarUrl: url } } : prev
    )
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <IconLoader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-muted-foreground">{error ?? "Gagal memuat profil"}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    )
  }

  const { user, stats } = profile
  const role = user.role ?? session?.user?.role ?? ""

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft size={16} />
        Kembali
      </button>

      <div>
        <h1 className="text-2xl font-bold">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">
          {ROLE_LABELS[role] ?? role}
          {user.isCurriculumCoordinator ? " · Koordinator Kurikulum" : ""}
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <IconUser size={18} className="text-muted-foreground" />
            <CardTitle className="text-base">Informasi Profil</CardTitle>
          </div>
          <CardDescription>Perbarui nama, email, dan nomor HP Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <AvatarPicker
            currentUrl={user.avatarUrl}
            userName={user.fullName ?? user.email ?? "User"}
            onUploaded={handleAvatarUploaded}
          />
          <Separator />
          <ProfileInfoForm user={user} onSaved={handleProfileSaved} />
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <IconLock size={18} className="text-muted-foreground" />
            <CardTitle className="text-base">Ubah Password</CardTitle>
          </div>
          <CardDescription>
            Masukkan password saat ini lalu tentukan password baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <IconChartBar size={18} className="text-muted-foreground" />
            <CardTitle className="text-base">Statistik</CardTitle>
          </div>
          <CardDescription>Ringkasan aktivitas Anda di sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          <StatsSection role={role} stats={stats} />
        </CardContent>
      </Card>
    </div>
  )
}
