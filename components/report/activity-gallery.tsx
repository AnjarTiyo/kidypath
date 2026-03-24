'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IconPhoto } from '@tabler/icons-react'

export interface ActivityImage {
  date: string | null
  imageUrl: string | null
}

interface ActivityGalleryProps {
  images: ActivityImage[]
}

export function ActivityGallery({ images }: ActivityGalleryProps) {
  const [lightbox, setLightbox] = useState<ActivityImage | null>(null)

  const filtered = images.filter((img) => !!img.imageUrl)

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconPhoto size={18} />
            Galeri Aktivitas Anak
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Tidak ada foto aktivitas pada periode ini
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3">
              {filtered.map((img, i) => (
                <button
                  key={i}
                  className="group relative rounded-md overflow-hidden border bg-muted aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-ring print:cursor-default"
                  onClick={() => setLightbox(img)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl!}
                    alt={`Aktivitas ${img.date ?? ''}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {img.date && (
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-0.5 px-1.5 text-center">
                      {new Date(img.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-2xl p-2">
          <DialogHeader className="px-2 pt-2">
            <DialogTitle className="text-sm">
              {lightbox?.date
                ? new Date(lightbox.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Foto Aktivitas'}
            </DialogTitle>
          </DialogHeader>
          {lightbox?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.imageUrl}
              alt="Foto aktivitas"
              className="w-full rounded-md object-contain max-h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
