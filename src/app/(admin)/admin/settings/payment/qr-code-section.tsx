"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { uploadPaymentQRCodeAction } from "@/app/(admin)/admin/settings/payment/actions";

export function QRCodeSection({
  settingsId,
  qrCodeUrl,
}: {
  settingsId: string;
  qrCodeUrl: string | null;
}) {
  const [previewUrl, setPreviewUrl] = useState(qrCodeUrl ?? "");

  const isUrl = previewUrl.startsWith("http://") || previewUrl.startsWith("https://");

  return (
    <div>
      <h5 className="mb-2 text-xs font-extrabold text-white/40 uppercase tracking-wider">
        رمز QR
      </h5>

      {previewUrl && isUrl && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="size-16 shrink-0 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="QR Code Preview"
              className="size-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-emerald-400">معاينة</p>
            <p className="mt-0.5 truncate text-xs text-white/40">{previewUrl}</p>
          </div>
        </div>
      )}

      <form action={uploadPaymentQRCodeAction} className="flex items-center gap-3">
        <input type="hidden" name="settingsId" value={settingsId} />
        <input
          name="assetId"
          value={previewUrl}
          onChange={(e) => setPreviewUrl(e.target.value)}
          placeholder="رابط صورة QR أو Asset ID"
          className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
        />
        <button
          type="submit"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-champagne/10 px-3 text-xs font-extrabold text-champagne transition hover:bg-champagne/20"
        >
          <QrCode size={14} />
          حفظ
        </button>
      </form>
    </div>
  );
}
