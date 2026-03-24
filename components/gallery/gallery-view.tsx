'use client'

import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { DateRangeSelector, DateRange } from '@/components/report/date-range-selector'
import { GalleryGrid } from './gallery-grid'
import { GalleryLightbox } from './gallery-lightbox'
import type { GalleryChild } from '@/app/api/parent/gallery/route'

interface GalleryViewProps {
  initialData: GalleryChild[]
}

export function GalleryView({ initialData }: GalleryViewProps) {
  const [data, setData] = useState<GalleryChild[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState<{ imageUrl: string; date: string } | null>(null)

  const handleRangeChange = useCallback(async (range: DateRange) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/parent/gallery?startDate=${range.startDate}&endDate=${range.endDate}`
      )
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Data anak belum tersedia. Hubungi sekolah untuk menghubungkan akun.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <DateRangeSelector onRangeChange={handleRangeChange} defaultGranularity="monthly" />

      <Tabs defaultValue={data[0].childName}>
        <TabsList>
          {data.map((child) => (
            <TabsTrigger key={child.childName} value={child.childName}>
              {child.childName}
            </TabsTrigger>
          ))}
        </TabsList>

        {data.map((child) => (
          <TabsContent key={child.childName} value={child.childName}>
            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Memuat foto...</p>
            ) : (
              <GalleryGrid
                images={child.images}
                onImageClick={(imageUrl, date) => setLightbox({ imageUrl, date })}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <GalleryLightbox
        imageUrl={lightbox?.imageUrl ?? null}
        date={lightbox?.date ?? null}
        onClose={() => setLightbox(null)}
      />
    </>
  )
}
