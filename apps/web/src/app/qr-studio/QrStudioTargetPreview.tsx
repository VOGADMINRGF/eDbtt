"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrStudioTargetPreview({
  absoluteTarget,
}: {
  absoluteTarget: string;
}) {
  const [qrImage, setQrImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void QRCode.toDataURL(absoluteTarget, { width: 240, margin: 1 })
      .then((dataUrl) => {
        if (!cancelled) setQrImage(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrImage(null);
      });

    return () => {
      cancelled = true;
    };
  }, [absoluteTarget]);

  return (
    <div data-testid="qr-studio-target-preview">
      {qrImage ? (
        <img
          src={qrImage}
          alt="QR-Code für das kanonische Ziel"
          className="h-28 w-28 rounded-xl border border-[rgb(var(--border))]"
        />
      ) : (
        <div
          className="h-28 w-28 rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
          aria-label="QR-Code wird vorbereitet"
        />
      )}
      {qrImage ? (
        <a
          href={qrImage}
          download="edebatte-public-entry-qr.png"
          className="mt-2 inline-block text-xs font-semibold text-slate-900 underline hover:text-slate-700"
        >
          QR-Code speichern
        </a>
      ) : null}
    </div>
  );
}
