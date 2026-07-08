"use client"
import { useEffect, useCallback } from "react"
import { X, Download, ImageIcon } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  imageUrl: string
  metadata?: {
    sizeBytes?: number | null
    width?: number | null
    height?: number | null
    mimeType?: string | null
  } | null
}

export function PaymentProofLightbox({ open, onClose, imageUrl, metadata }: Props) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <ImageIcon size={14} />
            {metadata?.width && metadata?.height && (
              <span>{metadata.width} × {metadata.height}</span>
            )}
            {metadata?.sizeBytes != null && (
              <span>{formatBytes(metadata.sizeBytes)}</span>
            )}
            {metadata?.mimeType && (
              <span className="text-white/30">{metadata.mimeType}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="flex size-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center overflow-auto p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="إثبات الدفع"
            className="max-h-[75vh] w-auto rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  )
}
