'use client'

import Image from 'next/image'

interface GalleryImage {
  date: string
  imageUrl: string
}

interface GalleryGridProps {
  images: GalleryImage[]
  onImageClick: (imageUrl: string, date: string) => void
}

export function GalleryGrid({ images, onImageClick }: GalleryGridProps) {
  if (images.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Belum ada foto di periode ini.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {images.map((img, idx) => (
        <button
          key={idx}
          onClick={() => onImageClick(img.imageUrl, img.date)}
          className="group relative aspect-square overflow-hidden rounded-md bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src={img.imageUrl}
            alt={img.date}
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
        </button>
      ))}
    </div>
  )
}
