'use client'

import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface GalleryLightboxProps {
  imageUrl: string | null
  date: string | null
  onClose: () => void
}

export function GalleryLightbox({ imageUrl, date, onClose }: GalleryLightboxProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <Dialog open={!!imageUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-2 gap-0">
        <VisuallyHidden>
          <DialogTitle>Foto aktivitas</DialogTitle>
        </VisuallyHidden>
        {imageUrl && (
          <div className="relative w-full aspect-square">
            <Image
              src={imageUrl}
              alt={formattedDate ?? 'Foto aktivitas'}
              fill
              unoptimized
              className="object-contain rounded-sm"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}
        {formattedDate && (
          <p className="text-center text-sm text-muted-foreground py-2">{formattedDate}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
