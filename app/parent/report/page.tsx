'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/layout/loading-state'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { IconChartBar, IconHome, IconLoader2, IconUser } from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface Child {
  id: string
  fullName: string | null
  classroomId: string | null
  birthDate: string | null
  gender: string | null
}

export default function ParentReportPage() {
  const router = useRouter()
  const { user, children, loading: userLoading } = useCurrentUser()

  useEffect(() => {
    if (!userLoading && !user) router.push('/auth/login')
    if (!userLoading && user && user.role !== 'parent') router.push('/unauthorized')
  }, [user, userLoading, router])

  if (userLoading) return <LoadingState message="Memuat data..." />
  if (!user) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Anak"
        description="Lihat laporan perkembangan dan laporan mingguan"
        breadcrumbs={[
          { label: 'Beranda', href: '/parent', icon: IconHome },
          { label: 'Laporan', icon: IconChartBar },
        ]}
      />

      {(!children || children.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Data anak belum tersedia. Hubungi sekolah untuk menghubungkan akun.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(children ?? []).map((child) => (
          <div key={child.id} className="space-y-2">
            <div className="p-4 rounded-lg border bg-card space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <IconUser size={20} className="text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{child.fullName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {child.gender ?? '—'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/parent/report/${child.id}`}
                  className="flex items-center justify-center gap-1 p-2.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors text-center"
                >
                  📊 Laporan Perkembangan
                </Link>
                <Link
                  href={`/parent/report/weekly/${child.id}`}
                  className="flex items-center justify-center gap-1 p-2.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors text-center"
                >
                  📋 Laporan Mingguan
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
