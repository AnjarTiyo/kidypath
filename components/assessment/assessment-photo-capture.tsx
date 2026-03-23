"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  IconCamera,
  IconLoader2,
  IconPhoto,
  IconX,
} from "@tabler/icons-react"
import Webcam from "react-webcam"

interface AssessmentPhotoCaptureProps {
  /** Saved image URL from DB. Pass null after clearing. */
  existingImageUrl: string | null
  /** True while the image is being uploaded to storage on save. */
  uploading: boolean
  /** Disable interactions while the form is submitting. */
  disabled: boolean
  /**
   * Called when the pending file changes.
   * @param file  New compressed file, or null when the photo is removed.
   * @param clearExisting  True if the existing DB url should also be cleared.
   */
  onChange: (file: File | null, clearExisting: boolean) => void
}

export function AssessmentPhotoCapture({
  existingImageUrl,
  uploading,
  disabled,
  onChange,
}: AssessmentPhotoCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showSourceDialog, setShowSourceDialog] = useState(false)
  const [showCameraDialog, setShowCameraDialog] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const webcamRef = useRef<Webcam>(null)

  const displayImage = previewUrl || existingImageUrl

  const compressAndSet = async (file: File) => {
    const imageCompression = (await import("browser-image-compression")).default
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    })
    const compressedFile = new File([compressed], file.name, { type: compressed.type })
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(compressedFile)
    })
    onChange(compressedFile, true)
  }

  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    try {
      await compressAndSet(file)
    } catch (err) {
      console.error("Image compression failed:", err)
    }
  }

  const handleCameraCapture = async () => {
    const screenshot = webcamRef.current?.getScreenshot()
    if (!screenshot) return
    try {
      const res = await fetch(screenshot)
      const blob = await res.blob()
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" })
      await compressAndSet(file)
      setShowCameraDialog(false)
    } catch (err) {
      console.error("Camera capture failed:", err)
    }
  }

  const handleRemove = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    onChange(null, true)
  }

  return (
    <>
      {/* Source picker dialog */}
      <Dialog open={showSourceDialog} onOpenChange={setShowSourceDialog}>
        <DialogContent className="max-w-xs p-4">
          <DialogHeader>
            <DialogTitle className="text-sm">Pilih Sumber Foto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowSourceDialog(false)
                setShowCameraDialog(true)
              }}
              className="flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium hover:bg-accent transition-colors"
            >
              <IconCamera className="h-7 w-7 text-primary" />
              <span className="text-xs">Kamera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSourceDialog(false)
                setTimeout(() => galleryInputRef.current?.click(), 100)
              }}
              className="flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium hover:bg-accent transition-colors"
            >
              <IconPhoto className="h-7 w-7 text-primary" />
              <span className="text-xs">Galeri</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Webcam dialog */}
      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent className="max-w-sm p-4">
          <DialogHeader>
            <DialogTitle className="text-sm">Ambil Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full rounded-md border object-cover"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCameraDialog(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleCameraCapture}
              >
                <IconCamera className="mr-1.5 h-4 w-4" />
                Tangkap
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden gallery input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGallerySelect}
      />

      {/* Section UI */}
      <div className="mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-[10px] sm:text-[11px] font-medium">
            Foto Aktivitas
            <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
          </Label>
          {!displayImage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSourceDialog(true)}
              disabled={disabled || uploading}
              className="h-6 sm:h-7 text-[9px] sm:text-[10px] px-1.5 sm:px-2"
            >
              <IconCamera className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Ambil Foto
            </Button>
          )}
        </div>

        {displayImage && (
          <div className="flex items-start gap-2">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="Foto aktivitas"
                className="h-28 sm:h-36 w-auto max-w-[180px] sm:max-w-[220px] rounded-md border object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                  <IconLoader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSourceDialog(true)}
                disabled={disabled || uploading}
                className="h-6 text-[9px] sm:text-[10px] px-2"
              >
                <IconCamera className="mr-1 h-2.5 w-2.5" />
                Ganti
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || uploading}
                className="h-6 text-[9px] sm:text-[10px] px-2 text-destructive hover:text-destructive"
              >
                <IconX className="mr-1 h-2.5 w-2.5" />
                Hapus
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
